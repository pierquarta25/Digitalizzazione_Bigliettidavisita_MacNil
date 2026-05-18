'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, User, Building2, Mail, Phone, Globe, MapPin, Tag, MessageSquare, Zap } from 'lucide-react'
import Link from 'next/link'
import { createContact } from '@/lib/actions/contacts'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ManualEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Precompila il form se arrivano dati dalla scansione
  useEffect(() => {
    const newData: any = { ...formData }
    let hasNewData = false

    searchParams.forEach((value, key) => {
      if (key in newData) {
        newData[key as keyof typeof formData] = value
        hasNewData = true
      }
    })

    if (hasNewData) {
      setFormData(newData)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createContact({
        ...formData,
        scan_source: searchParams.toString() ? 'ocr/qr' : 'manual',
      })

      if (result.success) {
        alert('Contatto salvato e sincronizzato!')
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Error saving contact:', error.message)
      alert('Errore durante il salvataggio: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/scan" className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Scansione
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dati Contatto</h1>
          {searchParams.toString() && (
            <span className="flex items-center gap-1 text-xs font-bold uppercase bg-secondary/20 text-secondary px-3 py-1 rounded-full animate-pulse border border-secondary/30">
              <Zap className="h-3 w-3 fill-current" /> Dati Suggeriti dall'AI
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-400" /> Nome
              </label>
              <input 
                name="first_name"
                required
                value={formData.first_name}
                className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
                placeholder="Es. Mario"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cognome</label>
              <input 
                name="last_name"
                required
                value={formData.last_name}
                className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
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
                value={formData.company}
                className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
                placeholder="Es. MacNil"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Ruolo</label>
              <input 
                name="role"
                value={formData.role}
                className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
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
              value={formData.email}
              className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
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
              value={formData.phone}
              className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
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
              className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
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
              value={formData.notes}
              rows={3}
              className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
              placeholder="Aggiungi dettagli sull'incontro o prodotti richiesti..."
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" disabled={loading}>
            <Save className="mr-2 h-5 w-5" />
            {loading ? 'Salvataggio...' : 'Salva Contatto'}
          </Button>
        </form>
      </main>
    </div>
  )
}
