import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ContactsListClient from '@/components/ContactsListClient'
import { decrypt } from '@/utils/crypto'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera i contatti dell'utente comprensivi di immagini allegate
  const { data: rawContacts } = await supabase
    .from('contacts')
    .select('*, attachments(*)')
    .order('created_at', { ascending: false })

  // Decrittografia dei dati sensibili in memoria prima di visualizzarli
  const contacts = rawContacts?.map((c: any) => ({
    ...c,
    email: decrypt(c.email),
    phone: decrypt(c.phone),
    notes: decrypt(c.notes)
  })) || []

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black pb-20 md:pb-8">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Header Sezione Minimalista */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              I Tuoi Lead
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold font-mono">
              {contacts?.length || 0}
            </span>
          </div>
          
          {/* Pulsante Nuovo compatto ed elegante solo per Desktop */}
          <Link href="/scan" className="hidden md:inline-block">
            <Button size="sm" className="font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-md transition-all px-4 py-2.5 text-xs">
              <Plus className="mr-1 h-4 w-4 stroke-[3]" />
              Nuovo
            </Button>
          </Link>
        </div>

        {/* Statistiche Flat & Minimaliste */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Totale Lead" value={contacts?.length || 0} />
          <StatCard label="Contatti Hot" value={contacts?.filter(c => c.lead_category === 'hot').length || 0} colorClass="text-red-500" />
          <StatCard label="Da Sincronizzare" value={contacts?.filter(c => !c.hubspot_id).length || 0} colorClass="text-amber-500" />
          <StatCard label="Acquisiti Oggi" value={contacts?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length || 0} />
        </div>

        {/* Client Component per ricerca, lista e dettagli */}
        <ContactsListClient initialContacts={contacts || []} />
      </main>

      {/* Pulsante Mobile FAB rotondo minimalista */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Link href="/scan">
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-xl shadow-secondary/30 active:scale-95 transition-all">
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, colorClass = "text-secondary" }: { label: string, value: number | string, colorClass?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-900/60 shadow-sm flex flex-col justify-center text-center sm:text-left">
      <div className={`text-xl md:text-2xl font-extrabold ${colorClass} tracking-tight`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 mt-1">{label}</div>
    </div>
  )
}
