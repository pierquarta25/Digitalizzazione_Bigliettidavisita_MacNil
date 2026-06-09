import { Button } from '@/components/ui/Button'
import { Camera, QrCode, ClipboardList, CheckCircle, Shield, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 flex flex-col justify-center py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-zinc-900 dark:text-zinc-50">
            Digitalizza i tuoi contatti <br />
            <span className="text-secondary">in un istante</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base text-zinc-500 dark:text-zinc-400 md:text-lg leading-relaxed">
            Lo strumento ideale per fiere, eventi e networking. 
            Acquisisci contatti all'istante tramite scansione o codici QR e sincronizzali sul tuo CRM.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row max-w-md mx-auto">
            <Link href="/scan" className="flex-1">
              <Button size="lg" className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold rounded-2xl shadow-lg shadow-secondary/15 py-6">
                <Camera className="mr-2 h-5 w-5" />
                Scansiona Biglietto
              </Button>
            </Link>
            <Link href="/manual-entry" className="flex-1">
              <Button variant="outline" size="lg" className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 font-bold rounded-2xl py-6">
                <ClipboardList className="mr-2 h-5 w-5" />
                Inserisci Dati
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto max-w-4xl mt-20 md:mt-28">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<Camera className="h-6 w-6 text-secondary" />}
              title="Riconoscimento Automatico"
              description="Estrai istantaneamente i dati da biglietti da visita cartacei tramite fotocamera."
            />
            <FeatureCard 
              icon={<QrCode className="h-6 w-6 text-secondary" />}
              title="Scanner QR Code"
              description="Leggi badge e contatti digitali in mobilità in una frazione di secondo."
            />
            <FeatureCard 
              icon={<RefreshCw className="h-6 w-6 text-secondary" />}
              title="Sincronizzazione CRM"
              description="Invia i contatti direttamente a HubSpot con un solo tocco dalla dashboard."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-6 w-6 text-secondary" />}
              title="Gestione Semplificata"
              description="Visualizza, filtra e organizza i contatti acquisiti con un'interfaccia pulita."
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-secondary" />}
              title="Sicurezza Integrata"
              description="Salvataggio sicuro su cloud nel pieno rispetto della privacy."
            />
            <FeatureCard 
              icon={<ClipboardList className="h-6 w-6 text-secondary" />}
              title="Note e Interessi"
              description="Associa dettagli specifici e categorie a ciascun lead durante l'evento."
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200/50 dark:border-zinc-900 py-8 px-4 bg-white dark:bg-zinc-950">
        <div className="container mx-auto text-center text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} MacNil. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col p-6 rounded-2xl border border-zinc-150 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 shadow-sm">
      <div className="mb-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 w-fit flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}
