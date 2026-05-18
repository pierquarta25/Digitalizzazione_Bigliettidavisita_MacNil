import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/Button'
import { Plus, Users, Search, Building2, Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera i contatti dell'utente (o del team se implementato RLS)
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">I Tuoi Lead</h1>
            <p className="text-zinc-500">Gestisci i contatti acquisiti durante l'evento.</p>
          </div>
          <Link href="/scan">
            <Button size="lg" className="w-full md:w-auto font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Nuova Acquisizione
            </Button>
          </Link>
        </div>

        {/* Stats Summary (Mobile Friendly) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Totale Lead" value={contacts?.length || 0} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Hot" value={contacts?.filter(c => c.lead_category === 'hot').length || 0} icon={<span>🔥</span>} />
          <StatCard label="Da Sincronizzare" value={contacts?.filter(c => !c.hubspot_id).length || 0} icon={<ExternalLink className="h-5 w-5" />} />
          <StatCard label="Oggi" value={contacts?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length || 0} icon={<Plus className="h-5 w-5" />} />
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Cerca per nome, email o azienda..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts && contacts.length > 0 ? (
            contacts.map((contact) => (
              <div key={contact.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border shadow-sm hover:border-secondary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{contact.first_name} {contact.last_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                      <Building2 className="h-4 w-4" /> {contact.company || 'Nessuna Azienda'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    contact.lead_category === 'hot' ? 'bg-destructive/10 text-destructive' :
                    contact.lead_category === 'warm' ? 'bg-secondary/10 text-secondary' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {contact.lead_category}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-zinc-400" /> {contact.email || 'Nessuna Email'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400" /> {contact.phone || 'Nessun Telefono'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">Dettagli</Button>
                  {!contact.hubspot_id && (
                    <Button variant="secondary" size="sm" className="font-bold">Sincronizza</Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed">
              <Users className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">Nessun contatto trovato.</p>
              <Link href="/scan" className="mt-4 inline-block text-secondary font-bold hover:underline">
                Inizia a scansionare lead!
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center">
      <div className="mb-2 text-primary">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{label}</div>
    </div>
  )
}
