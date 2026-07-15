'use client'

import { useEffect, useState, Suspense } from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, User, Building2, Mail, Phone, Tag, MessageSquare, Zap, Camera, Globe, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createContact } from '@/lib/actions/contacts'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

function ManualEntryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  
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
    lead_category: ['Cliente'],
    interest: '',
  })

  // Carica l'immagine pre-processata dal sessionStorage all'avvio
  useEffect(() => {
    try {
      const storedImage = sessionStorage.getItem('scannedCardImage')
      if (storedImage) {
        setScannedImage(storedImage)
      }
    } catch (err) {
      console.warn('Impossibile accedere al sessionStorage:', err)
    }
  }, [])

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
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const name = target.name
    
    if (target.type === 'select-multiple') {
      const selectTarget = target as HTMLSelectElement
      const selectedValues = Array.from(selectTarget.options)
        .filter(opt => opt.selected)
        .map(opt => opt.value)
      setFormData(prev => ({ ...prev, [name]: selectedValues }))
    } else {
      setFormData(prev => ({ ...prev, [name]: target.value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createContact({
        ...formData,
        lead_category: Array.isArray(formData.lead_category) ? formData.lead_category.join(', ') : formData.lead_category,
        cardImage: scannedImage, // Invia l'immagine compressa da salvare su storage
        scan_source: searchParams.toString() ? 'ocr/qr' : 'manual',
      })

      if (result.success) {
        // Rimuove l'immagine temporanea
        try {
          sessionStorage.removeItem('scannedCardImage')
        } catch (e) {}
        
        alert('Contatto salvato e sincronizzato!')
        router.push('/')
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
      <main className={cn("flex-1 container mx-auto px-4 py-8 transition-all duration-300", scannedImage ? "max-w-5xl" : "max-w-2xl")}>
        <Link href="/scan" className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Scansione
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dati Contatto</h1>
          {searchParams.toString() && (
            <span className="flex items-center gap-1 text-xs font-bold uppercase bg-secondary/20 text-secondary px-3 py-1 rounded-full animate-pulse border border-secondary/30">
              <Zap className="h-3 w-3 fill-current" /> Dati Rilevati
            </span>
          )}
        </div>

        <div className={cn("grid grid-cols-1 gap-8", scannedImage ? "lg:grid-cols-5" : "")}>
          
          {/* Anteprima Biglietto da Visita */}
          {scannedImage && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-secondary" /> Biglietto Scansionato
                </h3>
                <div className="rounded-xl overflow-hidden border bg-zinc-950 aspect-[3/2] flex items-center justify-center p-4 shadow-inner text-center">
                  {imageError ? (
                    <div className="text-zinc-400 space-y-2">
                      <span className="text-3xl">📱</span>
                      <h4 className="text-xs font-bold text-zinc-100">Anteprima non disponibile</h4>
                      <p className="text-[10px] max-w-[180px] leading-relaxed mx-auto">
                        Il browser non supporta la visualizzazione di questo formato (es. HEIC/Apple). I dati sono stati comunque acquisiti con successo.
                      </p>
                    </div>
                  ) : (
                    <img 
                      src={scannedImage} 
                      alt="Biglietto Scansionato" 
                      className="max-h-full max-w-full object-contain" 
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-3 text-center italic">
                  Usa l'immagine qui sopra come riferimento per verificare e correggere i dati acquisiti automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Form Dati */}
          <div className={cn(scannedImage ? "lg:col-span-3" : "")}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-400" /> Sito Web
                </label>
                <input 
                  name="website"
                  value={formData.website}
                  className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
                  placeholder="www.azienda.it"
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" /> Indirizzo / Sedi
                </label>
                <textarea 
                  name="address"
                  value={formData.address}
                  rows={2}
                  className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
                  placeholder="Es. Via Bari 12, Altamura (BA)"
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-zinc-400" /> Categoria Lead
                  </label>
                  <select 
                    name="lead_category"
                    multiple
                    className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-secondary outline-none transition-all"
                    onChange={handleChange}
                    value={formData.lead_category}
                  >
                    <option value="Business Partner">Business Partner</option>
                    <option value="Casa Auto">Casa Auto</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Dealer">Dealer</option>
                    <option value="Distributore Estero">Distributore Estero</option>
                    <option value="Distributore Italia">Distributore Italia</option>
                    <option value="Fornitore">Fornitore</option>
                    <option value="Installatore">Installatore</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Rivenditore">Rivenditore</option>
                    <option value="Segnalatore">Segnalatore</option>
                    <option value="Altro">Altro</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">Tieni premuto Ctrl (Windows) o Cmd (Mac) per selezionare più opzioni.</p>
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
                    placeholder="Dettagli sull'incontro o prodotti richiesti..."
                    onChange={handleChange}
                  />
                </div>

              <Button type="submit" className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" disabled={loading}>
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Salvataggio...' : 'Salva Contatto'}
              </Button>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function ManualEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-lg text-zinc-500 animate-pulse">Caricamento modulo...</p>
        </div>
      </div>
    }>
      <ManualEntryForm />
    </Suspense>
  )
}
