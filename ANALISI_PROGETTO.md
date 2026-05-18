# Analisi Tecnica del Progetto MacNil - Come L'Ho Costruito

## 📚 Indice
1. [Come ho organizzato il progetto](#come-ho-organizzato-il-progetto)
2. [I Modelli che ho creato](#i-modelli-che-ho-creato)
3. [I miei Controller](#i-miei-controller)
4. [I Servizi che ho implementato](#i-servizi-che-ho-implementato)
5. [La struttura del Database](#la-struttura-del-database)
6. [Il flusso quando qualcuno scansiona l'NFC](#il-flusso-quando-qualcuno-scansiona-lnfc)
7. [Livewire: come ho fatto i componenti interattivi](#livewire-come-ho-fatto-i-componenti-interattivi)
8. [Le scelte tecniche che ho fatto](#le-scelte-tecniche-che-ho-fatto)

---

## Come ho organizzato il progetto

Ho strutturato tutto seguendo la logica di Laravel. La cartella `app/` contiene tutta la logica dell'applicazione:

```
app/
├── Http/
│   ├── Controllers/          ← I miei controller per gestire le richieste
│   └── Middleware/           ← Il middleware IsAdmin per proteggere le zone admin
├── Models/                   ← I modelli del database (Contact, NfcLog, User)
├── Services/                 ← I servizi riutilizzabili (HubSpot, Aircall)
├── Jobs/                     ← Il job SincronizzaConHubSpot per la coda
└── Providers/                ← Configurazioni dei servizi
```

---

## I Modelli che ho creato

Ho creato tre modelli principali: **Contact**, **NfcLog** e **User**.

### Contact Model - Il cuore dell'app

```php
class Contact extends Model {
    protected $fillable = [
        'nome', 'cognome', 'email', 'telefono', 'azienda',
        'sorgente', 'membro_team', 'hubspot_id', 'sincronizzato_hubspot',
    ];

    protected $casts = [
        'sincronizzato_hubspot' => 'boolean',
    ];
}
```

**Cosa ho scelto di fare:**
- `$fillable` contiene tutti i campi che l'utente può compilare nel form
- `$casts` trasforma il campo `sincronizzato_hubspot` da 0/1 a true/false automaticamente

### Le relazioni che ho implementato

```php
// Ogni contatto ha molti log NFC
public function nfcLogs() {
    return $this->hasMany(NfcLog::class);
}
```

Così quando carico un contatto, posso accedere a tutti i suoi NFC log:
```php
$contatto = Contact::find(1);
$logs = $contatto->nfcLogs; // Prendi tutti gli accessi NFC del contatto
```

### Gli scopes che ho aggiunto

Ho creato due scopes per semplificare le query che faccio spesso:

```php
// Scope 1: Contatti che non sono ancora su HubSpot
public function scopeNonSincronizzati($query) {
    return $query->where('sincronizzato_hubspot', false);
}

// Utilizzo:
$daFare = Contact::nonSincronizzati()->get();
```

```php
// Scope 2: Contatti che arrivano dal NFC
public function scopeDaNfc($query) {
    return $query->where('sorgente', 'nfc');
}

// Utilizzo:
$nfcContatti = Contact::daNfc()->get();
```

---

## I miei Controller

Ho creato il **NfcController** per gestire il flusso della scansione.

### NfcController - Il principale

```php
class NfcController extends Controller {
    
    public function tap($membro) {
        // Quando scannerizzano il QR, mando la landing page
        return view('landing.blade.php', ['membro' => $membro]);
    }

    public function salvaContatto(Request $request) {
        // 1. Valido i dati del form
        $dati = $request->validate([
            'nome' => 'required|string|max:255',
            'cognome' => 'required|string|max:255',
            'email' => 'required|email|unique:contacts,email',
            'telefono' => 'required|string',
        ]);

        // 2. Salvo il contatto nel mio database
        $contatto = Contact::create($dati);

        // 3. Mando il contatto in coda per sincronizzare con HubSpot
        SincronizzaConHubSpot::dispatch($contatto);

        // 4. Reindirizzo alla pagina di ringraziamento
        return redirect()->route('conferma');
    }
}
```

**Come funziona:**
1. **tap()** - Quando l'utente scannerizza, riceve il form
2. **salvaContatto()** - Quando l'utente invia il form:
   - Valido che email soit valida e unica
   - Salvo nel database
   - Mando il job in background
   - Reindirizzo alla pagina di grazie

---

## I Servizi che ho implementato

Ho creato due servizi principali.

### HubSpotService - La sincronizzazione

Questo servizio comunica con l'API di HubSpot:

```php
class HubSpotService {
    private string $baseUrl = 'https://api.hubapi.com';
    private string $token;

    public function __construct() {
        $this->token = config('services.hubspot.token');
    }

    public function creaContatto(Contact $contact): array|null {
        $risposta = Http::timeout(10)
            ->retry(3, 100) // Retry automatico 3 volte
            ->withToken($this->token)
            ->post("{$this->baseUrl}/crm/v3/objects/contacts", [
                'properties' => [
                    'firstname' => $contact->nome,
                    'lastname' => $contact->cognome,
                    'email' => $contact->email,
                    'phone' => $contact->telefono,
                    'company' => $contact->azienda,
                    'sorgente_nfc' => $contact->membro_team ?? 'macnil',
                ],
            ]);

        if ($risposta->failed()) {
            Log::error('HubSpot sync failed', ['email' => $contact->email]);
            return null;
        }
        return $risposta->json();
    }

    public function cercaPerEmail(string $email): array|null {
        $risposta = Http::withToken($this->token)
            ->post("{$this->baseUrl}/crm/v3/objects/contacts/search", [
                'filterGroups' => [[
                    'filters' => [[
                        'propertyName' => 'email',
                        'operator' => 'EQ',
                        'value' => $email,
                    ]],
                ]],
            ]);

        return $risposta->failed() ? null : $risposta->json('results')[0] ?? null;
    }
}
```

**Ho scelto di:**
- Implementare un retry automatico in caso di errore di rete
- Cercare l'email prima di creare per evitare duplicati
- Loggare gli errori per debug

### AircallService - Per l'integrazione telefonica

Ho creato una base per l'integrazione con Aircall, che posso espandere dopo.

---

## La struttura del Database

Ho creato le migrations per il database. Ecco come ho strutturato i dati:

### Tabella Contacts
```php
Schema::create('contacts', function (Blueprint $table) {
    $table->id();
    $table->string('nome');
    $table->string('cognome');
    $table->string('email')->unique();  // Email unica
    $table->string('telefono');
    $table->string('azienda')->nullable();
    $table->string('sorgente');         // 'nfc', 'form', 'aircall'
    $table->string('membro_team');
    $table->string('hubspot_id')->nullable();
    $table->boolean('sincronizzato_hubspot')->default(false);
    $table->timestamps();
});
```

### Tabella NFC Logs
```php
Schema::create('nfc_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
    $table->string('nfc_code');
    $table->timestamp('scanned_at');
});
```

### Tabella Users (per gli admin)
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('password');
    $table->boolean('is_admin')->default(false);
    $table->timestamps();
});
```

---

## Il flusso quando qualcuno scansiona l'NFC

Ho organizzato il flusso così:

```
1️⃣  Utente scannerizza QR
    └─> Apre URL: /nfc/macnil

2️⃣  Laravel routing
    └─> Route::get('/nfc/{membro}', [NfcController::class, 'tap'])
    └─> Chiama il mio controller

3️⃣  Il controller risponde
    └─> NfcController@tap('macnil')
    └─> Ritorna la landing page

4️⃣  L'utente vede il form
    └─> resources/views/landing.blade.php
    └─> Inserisce nome, email, telefono

5️⃣  L'utente clicca "Conferma"
    └─> POST /contatto/salva
    └─> Metodo salvaContatto del controller

6️⃣  Validazione
    └─> Controllo che email, nome, telefono siano corretti
    └─> Se non va bene, ritorno gli errori

7️⃣  Salvataggio
    └─> Contact::create($dati)
    └─> Il contatto entra nel mio database

8️⃣  Mando il job in coda
    └─> SincronizzaConHubSpot::dispatch($contatto)
    └─> Non aspetto la risposta, continuo

9️⃣  Reindirizzo
    └─> Mando l'utente a /grazie

🔟 In background (in parallelo)
    └─> La queue ascolta
    └─> Esegue SincronizzaConHubSpot
    └─> HubSpotService::creaContatto()
    └─> Sincronizza con HubSpot
```

---

## Livewire - Come ho fatto i componenti interattivi

Ho usato **Livewire** per creare componenti che si aggiornano senza ricaricare la pagina.

### Il componente ContactList che ho creato

```php
namespace App\Livewire;
use Livewire\Component;
use App\Models\Contact;

class ContactList extends Component {
    public $contatti = [];
    public $filtro = '';

    public function mount() {
        $this->caricaContatti();
    }

    public function caricaContatti() {
        $this->contatti = Contact::when($this->filtro, function ($q) {
            $q->where('nome', 'like', '%' . $this->filtro . '%')
              ->orWhere('email', 'like', '%' . $this->filtro . '%');
        })->get();
    }

    public function updatedFiltro() {
        // Ogni volta che cambia il filtro, ricarica
        $this->caricaContatti();
    }

    public function eliminaContatto($id) {
        Contact::destroy($id);
        $this->caricaContatti(); // Recarica la lista
    }

    public function render() {
        return view('livewire.contact-list');
    }
}
```

**Come funziona:**
- `mount()` carica i dati all'inizio
- `updatedFiltro()` viene chiamato automaticamente quando l'input cambia
- `eliminaContatto()` elimina e recarica senza ricaricare la pagina
- `render()` ritorna il template

### Come l'ho usato nella view admin

```blade
<!-- resources/views/admin/contatti.blade.php -->
<div class="container">
    <livewire:contact-list />
</div>
```

Tutto li! Livewire gestisce l'interattività senza che io scriva JavaScript.

---

## Le scelte tecniche che ho fatto

### 1. Rate Limiting per il form NFC
```php
Route::post('/contatto/salva', [NfcController::class, 'salvaContatto'])
    ->middleware('throttle:30,1'); // Max 30 richieste al minuto
```
L'ho fatto perché non voglio che qualcuno faccia spam di contatti.

### 2. Middleware IsAdmin per proteggere le aree riservate
```php
class IsAdmin {
    public function handle(Request $request, Closure $next) {
        if (!auth()->user()?->is_admin) {
            abort(403, 'Non sei admin');
        }
        return $next($request);
    }
}
```
Così solo gli admin possono accedere a `/admin/dashboard`.

### 3. Job asincrono per HubSpot
```php
class SincronizzaConHubSpot implements ShouldQueue {
    public function __construct(private Contact $contatto) {}

    public function handle(HubSpotService $service) {
        $service->sincronizzaContatto($this->contatto);
    }
}
```
L'ho fatto in background così il form ritorna subito all'utente. Se HubSpot è lento, non rallenta il sito.

### 4. Unique email nel database
```php
$table->string('email')->unique();
```
Così non posso avere due contatti con la stessa email.

### 5. Casting automatico
```php
protected $casts = [
    'sincronizzato_hubspot' => 'boolean',
];
```
Ho fatto così perché nel database è 0/1, ma nel codice voglio usare true/false.

---

## 💡 Concetti chiave del mio codice

| Cosa | Come l'ho usato |
|------|-----------------|
| **Models** | Contact, User, NfcLog per rappresentare i dati |
| **Controllers** | NfcController per gestire il flusso della scansione |
| **Services** | HubSpotService per parlare con le API esterne |
| **Middleware** | IsAdmin per proteggere le rotte admin |
| **Migrations** | Per versionare i cambiamenti al database |
| **Jobs** | SincronizzaConHubSpot per elaborazione asincrona |
| **Livewire** | ContactList per componenti interattivi |
| **Validation** | Nel controller per controllare i dati |
| **Rate Limiting** | Sul form NFC per evitare spam |

---

## Come testare quello che ho fatto

### Test del flow NFC
1. Apri `/nfc/macnil` nel browser
2. Compila il form con dati di prova
3. Quando invii, dovresti essere reindirizzato a `/grazie`
4. Controlla in database che il contatto sia stato creato

### Test della sincronizzazione HubSpot
1. Assicurati che il token HubSpot sia nel .env
2. Avvia la queue: `php artisan queue:listen`
3. Crea un contatto dal form
4. La queue dovrebbe elaborare il job e sincronizzare

### Test della dashboard admin
1. Login con un account admin a `/admin/login`
2. Accedi a `/admin/dashboard`
3. Il componente Livewire dovrebbe mostrare le statistiche

---

## Le risorse che ho usato

- [Documentazione Laravel](https://laravel.com/docs)
- [Documentazione Livewire](https://livewire.laravel.com)
- [API HubSpot](https://developers.hubspot.com/docs/api)
- [Laravel Queue documentation](https://laravel.com/docs/queues)

---

**Sviluppato il:** 30 Marzo 2026  
**Da:** Pierfilippo Quartarella - Stage MacNil  
**Progetto:** MacNil Contact Manager NFC + HubSpot Integration
