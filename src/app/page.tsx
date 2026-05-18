import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { Camera, QrCode, ClipboardList, Zap, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 dark:from-zinc-900 dark:to-black">
          <div className="container mx-auto text-center">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl text-zinc-900 dark:text-zinc-50">
              Digitalizza i tuoi contatti <br />
              <span className="text-blue-600">in un istante</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
              Lo strumento definitivo per fieri, eventi e networking professionale.
              Acquisisci lead tramite OCR e QR code e sincronizzali col tuo CRM.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/scan">
                <Button size="lg" className="w-full sm:w-auto">
                  <Camera className="mr-2 h-5 w-5" />
                  Inizia a Scansionare
                </Button>
              </Link>
              <Link href="/manual-entry">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Inserimento Manuale
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="mb-16 text-center text-3xl font-bold">Funzionalità Principali</h2>
            
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard 
                icon={<Camera className="h-8 w-8 text-blue-600" />}
                title="Scansione OCR"
                description="Estrai automaticamente dati da biglietti da visita fisici usando la potenza dell'AI."
              />
              <FeatureCard 
                icon={<QrCode className="h-8 w-8 text-blue-600" />}
                title="Scanner QR"
                description="Leggi istantaneamente badge e contatti digitali tramite codici QR."
              />
              <FeatureCard 
                icon={<Zap className="h-8 w-8 text-blue-600" />}
                title="Automazione Lead"
                description="Sincronizzazione immediata con HubSpot e creazione automatica di follow-up."
              />
              <FeatureCard 
                icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
                title="Dashboard Team"
                description="Gestisci il tuo team sales e visualizza le performance in tempo reale."
              />
              <FeatureCard 
                icon={<Shield className="h-8 w-8 text-blue-600" />}
                title="Sicurezza & GDPR"
                description="Dati protetti, backup cloud automatico e conformità totale."
              />
              <FeatureCard 
                icon={<ClipboardList className="h-8 w-8 text-blue-600" />}
                title="Note & Allegati"
                description="Aggiungi note vocali e foto a ogni lead per non perdere alcun dettaglio."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 px-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto text-center text-zinc-500">
          <p>© 2026 MacNil Contact Manager. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:shadow-lg transition-shadow bg-white dark:bg-zinc-900">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}
