# MacNil Contact Manager - NFC & HubSpot Integration

Piattaforma web di gestione contatti con integrazione NFC e sincronizzazione automatica con HubSpot. Sviluppato da MacNil - Gravina in Puglia.

## 📋 Descrizione

Applicazione Laravel che consente di:
- **Acquisire contatti tramite tag NFC**: Scansionando un codice NFC, i visitatori compilano un form veloce per registrarsi
- **Sincronizzare automaticamente con HubSpot**: Ogni contatto creato viene trasferito in tempo reale al CRM aziendale
- **Gestire dati in Dashboard**: Area admin protetta per visualizzare statistiche, contatti e log delle scansioni NFC
- **Tracciare interazioni**: Ogni scansione NFC viene registrata con timestamp e membro del team

## 🚀 Tech Stack

| Layer | Tecnologie |
|-------|-----------|
| **Backend** | PHP 8.3, Laravel 13, Livewire 3 |
| **Frontend** | React 19.2, Tailwind CSS 4.2, Bootstrap 5.3 |
| **Build Tools** | Vite, Laravel Vite Plugin |
| **Database** | SQLite/MySQL (configurabile) |
| **External APIs** | HubSpot, Aircall |
| **Job Queue** | Laravel Queue System |

### Dipendenze Principali
- `livewire/livewire` ^3.0 - Componenti interattivi real-time
- `axios` ^1.11 - HTTP client per API calls
- `recharts` ^3.8 - Grafici e visualizzazioni dati
- `@fortawesome/fontawesome-free` ^7.2 - Icone

## 🏗️ Architettura

```
app/
├── Http/
│   ├── Controllers/        # NfcController, DashboardController, AuthController
│   └── Middleware/         # IsAdmin (protezione rotte admin)
├── Jobs/
│   └── SincronizzaConHubSpot.php    # Job asincrono per sincronizzazione
├── Livewire/
│   ├── ContactList.php     # Componente lista contatti
│   └── StatsLive.php       # Dashboard statistiche
├── Models/
│   ├── Contact.php         # Modello contatto con scopes e relazioni
│   ├── User.php            # Utenti admin
│   └── NfcLog.php          # Log delle scansioni NFC
└── Services/
    ├── HubSpotService.php  # Integrazione HubSpot API
    └── AircallService.php  # Integrazione Aircall
```

## 📊 Modelli Dati

### Contact
```
- nome, cognome
- email, telefono
- azienda, sorgente
- membro_team
- hubspot_id
- sincronizzato_hubspot (boolean)
- relazione: hasMany(NfcLog)
```

### NfcLog
```
- contact_id (FK)
- nfc_code
- timestamp
```

### User
```
- email, password
- is_admin
```

## 🔄 Flusso Principale

1. **Scansione NFC** → `/nfc/{membro}`
2. **Landing Page** → Modulo di acquisizione dati
3. **Salvataggio Contatto** → POST `/contatto/salva` (throttled a 30 req/min)
4. **Job Asincrono** → `SincronizzaConHubSpot` in coda
5. **Sincronizzazione HubSpot** → `HubSpotService` crea/aggiorna contatto
6. **Dashboard Admin** → `/admin/dashboard` visualizza statistiche

## 🚀 Setup & Installazione

### Prerequisiti
- PHP 8.3+
- Node.js 18+
- Composer
- Database (SQLite/MySQL)

### Installazione Rapida

```bash
# 1. Clone e navigazione
cd /Users/pierfilippoquartarella/wa/Progetto_MacNil

# 2. Setup automatico (installa dipendenze, genera chiavi, migra DB, build assets)
composer run-script setup

# 3. Configura .env con credenziali HubSpot e Aircall
nano .env
```

### Variabili .env Essenziali

```env
APP_NAME=MacNil
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...

DB_CONNECTION=sqlite
DB_DATABASE=database.sqlite

# HubSpot API Token
HUBSPOT_TOKEN=your_hubspot_token_here

# Aircall API (opzionale)
AIRCALL_API_KEY=your_aircall_key_here
```

### Avvio Development

```bash
# Avvia server + queue + vite + logs (concorrentemente)
composer run-script dev
```

Questo avvierà:
- Server Laravel in `http://localhost:8000`
- Queue listener per job asincroni
- Vite dev server con hot reload
- Pail per visualizzare i log

## 🔐 Autenticazione

### Login Admin
```
POST /admin/login
- email: admin@macnil.com
- password: secure_password
```

Middleware `IsAdmin` protegge le rotte admin:
- `/admin/dashboard` - Dashboard con statistiche
- `/admin/contatti` - Lista completa contatti

## 📡 API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/nfc/{membro}` | Pagina scansione NFC |
| GET | `/landing/{membro}` | Landing page contatto |
| POST | `/contatto/salva` | Salva nuovo contatto (throttled) |
| GET | `/grazie` | Pagina conferma |
| GET | `/admin/dashboard` | Dashboard statistiche (admin only) |
| GET | `/admin/contatti` | Lista contatti (admin only) |

## 🔧 Configurazione HubSpot

1. Genora un **Private App Token** da [HubSpot Developer](https://developers.hubspot.com)
2. Assegna permessi: `crm.objects.contacts.read`, `crm.objects.contacts.write`
3. Aggiungi token a `.env`:
   ```
   HUBSPOT_TOKEN=pat-xx-xxx-xxx
   ```

Il servizio `HubSpotService` offre:
- `creaContatto(Contact)` - Crea nuovo contatto
- `cercaPerEmail(email)` - Cerca per evitare duplicati
- `sincronizzaContatto(Contact)` - Crea o aggiorna

## 📦 Queue Jobs

### SincronizzaConHubSpot
Elabora contatti e li sincronizza in background:

```bash
# Ascolta job in coda
php artisan queue:listen

# Processa singolo job
php artisan queue:work
```

## 🧪 Testing

```bash
# Esegui tutti i test
composer run-script test

# Test specifici
php artisan test tests/Feature/ExampleTest.php

# Coverage
php artisan test --coverage
```

## 📝 Struttura Cartelle Rilevanti

```
database/
├── migrations/           # Schema DB
├── factories/            # Factory per test (ContactFactory, UserFactory)
└── seeders/             # Database seeders

routes/
├── web.php              # Rotte public/protette
└── api.php              # API endpoints

resources/
├── views/               # Blade templates
│   ├── dashboard.blade.php
│   ├── landing.blade.php
│   └── conferma.blade.php
├── js/                  # React components
│   ├── components/
│   └── app.jsx
└── css/                 # Tailwind + custom styles

tests/                   # Unit e Feature tests
```

## 🎯 Features Implementate

✅ Autenticazione admin con middleware protezione
✅ Acquisizione contatti via form NFC
✅ Sincronizzazione automatica con HubSpot  
✅ Dashboard con statistiche real-time (Livewire)
✅ Logging delle scansioni NFC
✅ Componenti React interattivi
✅ Styling Tailwind + Bootstrap
✅ Rate limiting (`throttle:30,1`)
✅ Job queue asincroni
✅ Integrazione Aircall (base setup)

## 🔜 Prossimi Step (Sviluppo)

- [ ] Webhook HubSpot per sincronizzazione bidirezionale
- [ ] Esportazione dati (CSV/Excel)
- [ ] Notifiche email su nuovi contatti
- [ ] Statistiche avanzate e report
- [ ] Integrazione SMS per follow-up
- [ ] Multi-language support (IT/EN)

## 📧 Support & Documentazione

- [Laravel Docs](https://laravel.com/docs)
- [Livewire Docs](https://livewire.laravel.com)
- [HubSpot API](https://developers.hubspot.com/docs/api)

## 📄 Licenza

MIT License - vedi file LICENSE

---

**Sviluppato per MacNil** - Pierfilippo Quartarella - Gravina in Puglia, 2026
