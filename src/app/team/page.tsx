import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/Button'
import { Users, Trophy, Target, Mail, ArrowUpRight, UserPlus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // In un caso reale, qui faremmo una query complessa con join sui profili
  // Per ora simuliamo i dati del team basandoci sui contatti esistenti
  const { data: allContacts } = await supabase
    .from('contacts')
    .select('first_name, last_name, lead_category, created_by')

  // Mock dei membri del team (in futuro verranno dalla tabella 'profiles' o 'team_members')
  const teamStats = [
    { 
      id: 1, 
      name: 'Tu', 
      email: user.email, 
      leads: allContacts?.length || 0, 
      hot: allContacts?.filter(c => c.lead_category === 'hot').length || 0,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' 
    },
    { 
      id: 2, 
      name: 'Marco Rossi', 
      email: 'm.rossi@macnil.it', 
      leads: 12, 
      hot: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marco' 
    },
    { 
      id: 3, 
      name: 'Giulia Bianchi', 
      email: 'g.bianchi@macnil.it', 
      leads: 28, 
      hot: 14,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=giulia' 
    },
  ].sort((a, b) => b.leads - a.leads)

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Performance Team</h1>
            <p className="text-zinc-500">Monitora i risultati e la crescita del tuo team sales.</p>
          </div>
          <Button className="bg-secondary hover:bg-secondary/90 font-bold">
            <UserPlus className="mr-2 h-5 w-5" />
            Invita Collega
          </Button>
        </div>

        {/* Top Performer Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2 bg-primary text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-secondary font-bold uppercase tracking-wider text-sm">
                <Trophy className="h-5 w-5" /> Top Performer della Settimana
              </div>
              <h2 className="text-4xl font-black mb-2">{teamStats[0].name}</h2>
              <p className="text-zinc-300 mb-6 max-w-md">
                Sta guidando la classifica con {teamStats[0].leads} nuovi contatti e un tasso di conversione del {Math.round((teamStats[0].hot / teamStats[0].leads) * 100)}%.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl font-bold">{teamStats[0].leads}</div>
                  <div className="text-xs text-zinc-400 uppercase">Lead Totali</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-secondary">{teamStats[0].hot}</div>
                  <div className="text-xs text-zinc-400 uppercase">Lead Hot</div>
                </div>
              </div>
            </div>
            <TrendingUp className="absolute right-[-20px] bottom-[-20px] h-64 w-64 text-white/5 -rotate-12" />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border shadow-sm flex flex-col justify-center text-center">
            <Target className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Obiettivo Evento</h3>
            <div className="text-4xl font-black text-primary mb-2">78/100</div>
            <p className="text-zinc-500 text-sm">Mancano 22 lead per raggiungere il target prefissato.</p>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full mt-6 overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold">Classifica Membri</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Membro</th>
                  <th className="px-6 py-4">Lead Totali</th>
                  <th className="px-6 py-4">Lead Hot</th>
                  <th className="px-6 py-4">Trend</th>
                  <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {teamStats.map((member, index) => (
                  <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image 
                            src={member.avatar} 
                            alt={member.name} 
                            width={40} 
                            height={40} 
                            className="rounded-full bg-zinc-100"
                          />
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-white">
                              <Trophy className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold">{member.name}</div>
                          <div className="text-xs text-zinc-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-lg">{member.leads}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-sm">
                        {member.hot} 🔥
                      </span>
                    </td>
                    <td className="px-6 py-4 text-green-500 font-medium">
                      +{Math.floor(Math.random() * 5) + 1} oggi
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-secondary">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
