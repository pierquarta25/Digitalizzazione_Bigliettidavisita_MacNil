import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/Button'
import { Plus, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ContactsListClient from '@/components/ContactsListClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera i contatti dell'utente comprensivi di immagini allegate
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, attachments(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black pb-20 md:pb-8">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">I Tuoi Lead</h1>
            <p className="text-xs md:text-sm text-zinc-500 font-medium">Gestisci i contatti acquisiti in tempo reale.</p>
          </div>
          <Link href="/scan" className="hidden md:inline-block">
            <Button size="lg" className="font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg shadow-secondary/15 transition-all">
              <Plus className="mr-2 h-5 w-5" />
              Nuova Acquisizione
            </Button>
          </Link>
        </div>

        {/* Stats Summary (Mobile Friendly Scrollable Row) */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-none snap-x snap-mandatory">
          <div className="snap-start shrink-0 min-w-[140px] md:flex-1">
            <StatCard label="Totale Lead" value={contacts?.length || 0} icon={<Users className="h-4 w-4" />} />
          </div>
          <div className="snap-start shrink-0 min-w-[140px] md:flex-1">
            <StatCard label="Hot" value={contacts?.filter(c => c.lead_category === 'hot').length || 0} icon={<span>🔥</span>} />
          </div>
          <div className="snap-start shrink-0 min-w-[140px] md:flex-1">
            <StatCard label="Da Sincronizzare" value={contacts?.filter(c => !c.hubspot_id).length || 0} icon={<ExternalLink className="h-4 w-4" />} />
          </div>
          <div className="snap-start shrink-0 min-w-[140px] md:flex-1">
            <StatCard label="Acquisiti Oggi" value={contacts?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length || 0} icon={<Plus className="h-4 w-4" />} />
          </div>
        </div>

        {/* Client Component per la ricerca, lista e modal dettagli */}
        <ContactsListClient initialContacts={contacts || []} />
      </main>

      {/* Floating Action Button (FAB) for Mobile Scan */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Link href="/scan">
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-xl shadow-secondary/35 active:scale-95 transition-all">
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm flex items-center gap-3 w-full">
      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-secondary flex items-center justify-center">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</div>
        <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400">{label}</div>
      </div>
    </div>
  )
}
