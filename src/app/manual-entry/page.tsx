'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, User, Building2, Mail, Phone, Globe, MapPin, Tag, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ManualEntryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    role: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    notes: '',
    lead_category: 'warm',
    interest: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.from('contacts').insert([
        {
          ...formData,
          user_id: user?.id,
          scan_source: 'manual',
        }
      ])

      if (error) throw error

      alert('Contatto salvato con successo!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error saving contact:', error.message)
      alert('Errore durante il salvataggio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/scan" className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Scansione
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Inserimento Manuale</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-400" /> Nome
              </label>
              <input 
                name="first_name"
                required
                className="w-full p-2 border rounded-md bg-transparent"
                placeholder="Es. Mario"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cognome</label>
              <input 
                name="last_name"
                required
                className="w-full p-2 border rounded-md bg-transparent"
                placeholder="Es. Rossi"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" /> Azienda
              </label>
              <input 
                name="company"
                className="w-full p-2 border rounded-md bg-transparent"
                placeholder="Es. MacNil"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Ruolo</label>
              <input 
                name="role"
                className="w-full p-2 border rounded-md bg-transparent"
                placeholder="Es. CEO"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-400" /> Email
            </label>
            <input 
              name="email"
              type="email"
              className="w-full p-2 border rounded-md bg-transparent"
              placeholder="mario.rossi@azienda.it"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-zinc-400" /> Telefono
            </label>
            <input 
              name="phone"
              className="w-full p-2 border rounded-md bg-transparent"
              placeholder="+39 012 3456789"
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-zinc-400" /> Categoria Lead
            </label>
            <select 
              name="lead_category"
              className="w-full p-2 border rounded-md bg-transparent"
              onChange={handleChange}
              value={formData.lead_category}
            >
              <option value="hot">🔥 Hot (Molto interessato)</option>
              <option value="warm">⚡ Warm (Interessato)</option>
              <option value="cold">❄️ Cold (Poco interessato)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" /> Note / Interessi
            </label>
            <textarea 
              name="notes"
              rows={3}
              className="w-full p-2 border rounded-md bg-transparent"
              placeholder="Aggiungi dettagli sull'incontro o prodotti richiesti..."
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvataggio...' : 'Salva Contatto'}
          </Button>
        </form>
      </main>
    </div>
  )
}
