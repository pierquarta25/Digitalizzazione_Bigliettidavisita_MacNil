'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Search, Building2, Mail, Phone, ExternalLink, X, Globe, MapPin, Calendar, CheckCircle, AlertCircle, MessageSquare, Camera, Activity, Sparkles, Tag, ChevronRight, FileSpreadsheet, Pencil, Save } from 'lucide-react'
import { syncContact, updateContact } from '@/lib/actions/contacts'
import * as XLSX from 'xlsx'

interface ContactsListClientProps {
  initialContacts: any[]
}

export default function ContactsListClient({ initialContacts }: ContactsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [modalImageError, setModalImageError] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<any>({})

  // Reset modal image error state when selected contact changes
  useEffect(() => {
    setModalImageError(false)
    setIsEditing(false)
  }, [selectedContact])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateContact(selectedContact.id, {
        ...selectedContact,
        ...editData
      })
      if (res.success) {
        alert('Contatto aggiornato con successo!')
        window.location.reload()
      }
    } catch (err: any) {
      alert(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (id: string) => {
    setSyncingId(id)
    try {
      const res = await syncContact(id)
      if (res.success) {
        alert('Contatto sincronizzato con successo su HubSpot!')
        window.location.reload()
      }
    } catch (err: any) {
      alert(err.message || 'Errore durante la sincronizzazione.')
    } finally {
      setSyncingId(null)
    }
  };

  // Filtra i contatti
  const filteredContacts = initialContacts.filter((c) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    return (
      fullName.includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query) ||
      c.role?.toLowerCase().includes(query)
    )
  })

  // Esporta i contatti filtrati in un foglio Excel nativo (.xlsx)
  const exportToExcel = () => {
    try {
      if (filteredContacts.length === 0) {
        alert('Nessun contatto da esportare.')
        return
      }

      const rows = filteredContacts.map((c) => ({
        'Nome': c.first_name || '',
        'Cognome': c.last_name || '',
        'Azienda': c.company || '',
        'Ruolo': c.role || '',
        'Email': c.email || '',
        'Telefono': c.phone || '',
        'Sito Web': c.website || '',
        'Indirizzo': c.address || '',
        'Città': c.metadata?.city || '',
        'Provincia': c.metadata?.province || '',
        'CAP': c.metadata?.postal_code || '',
        'Regione': c.metadata?.region || '',
        'Nazione': c.metadata?.country || '',
        'Partita Iva': c.metadata?.vat_number || '',
        'Categoria Lead': c.lead_category || '',
        'Linea Business': Array.isArray(c.metadata?.business_line) ? c.metadata.business_line.join(', ') : (c.metadata?.business_line || ''),
        'Sincronizzato HubSpot': c.hubspot_id ? 'Sì' : 'No',
        'ID HubSpot': c.hubspot_id || '',
        'Note': c.notes || '',
        'Data di Acquisizione': c.created_at ? new Date(c.created_at).toLocaleString('it-IT') : ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatti')

      // Calcola e regola la larghezza delle colonne per evitare troncamenti
      const maxLens = Object.keys(rows[0] || {}).reduce((acc: any, key: string) => {
        let maxLen = key.length
        rows.forEach((row: any) => {
          const val = String(row[key] || '')
          if (val.length > maxLen) {
            maxLen = val.length
          }
        })
        acc[key] = Math.min(Math.max(maxLen + 2, 10), 50)
        return acc
      }, {})

      worksheet['!cols'] = Object.keys(maxLens).map((key: string) => ({
        wch: maxLens[key]
      }))

      const today = new Date().toISOString().split('T')[0]
      XLSX.writeFile(workbook, `Contatti_MacNil_${today}.xlsx`)
    } catch (error: any) {
      console.error('Errore durante esportazione Excel:', error)
      alert("Impossibile esportare i dati in Excel. Riprova.")
    }
  }

  return (
    <>
      {/* Search Bar & Actions */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Cerca contatti..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/60 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all text-sm shadow-sm placeholder-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
        </div>
        {initialContacts.length > 0 && (
          <Button 
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold px-4 py-3 h-auto text-xs shadow-sm flex items-center gap-1.5 transition-all shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Esporta</span>
          </Button>
        )}
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              onClick={() => setSelectedContact(contact)}
              className="group relative bg-white dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-300 cursor-pointer flex justify-between items-center"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 truncate">
                    {contact.first_name} {contact.last_name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500`}>
                    {contact.lead_category}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mb-2">
                  {contact.role ? `${contact.role} · ` : ''}{contact.company || 'Nessuna Azienda'}
                </p>

                <div className="flex flex-wrap gap-y-1 gap-x-3 text-[10px] text-zinc-400">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {contact.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                {/* Sync Status / Action Button */}
                {!contact.hubspot_id ? (
                  <button 
                    onClick={() => handleSync(contact.id)}
                    disabled={syncingId !== null}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-secondary/10 hover:text-secondary text-zinc-400 transition-all active:scale-95 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800"
                    title="Sincronizza con HubSpot"
                  >
                    {syncingId === contact.id ? (
                      <span className="h-4 w-4 border-2 border-zinc-300 border-t-secondary rounded-full animate-spin"></span>
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="p-2.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20" title="Sincronizzato">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                )}
                <button 
                  onClick={() => setSelectedContact(contact)}
                  className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-400 hover:text-zinc-650 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Search className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
            <p className="text-zinc-500 text-sm font-medium">Nessun contatto trovato.</p>
          </div>
        )}
      </div>

      {/* Details Modal (Bottom Sheet on Mobile, Centered Dialog on Desktop) */}
      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedContact(null)} />
          
          <div className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-950 border-t md:border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-t-[2rem] md:rounded-3xl overflow-hidden p-6 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh] z-10 transition-transform animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95">
            {/* Drag Handle for Mobile */}
            <div className="md:hidden w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setSelectedContact(null)} />

            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  {isEditing ? 'Modifica Contatto' : `${selectedContact.first_name} ${selectedContact.last_name}`}
                </h2>
                {!isEditing && (
                  <p className="text-xs md:text-sm text-zinc-500 font-medium flex items-center gap-1.5 mt-1">
                    <Building2 className="h-3.5 w-3.5" /> {selectedContact.role ? `${selectedContact.role} @ ` : ''}{selectedContact.company || 'Nessuna Azienda'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!isEditing && (
                  <button 
                    onClick={() => {
                      setEditData({
                        first_name: selectedContact.first_name || '',
                        last_name: selectedContact.last_name || '',
                        email: selectedContact.email || '',
                        phone: selectedContact.phone || '',
                        website: selectedContact.website || '',
                        address: selectedContact.address || '',
                        company: selectedContact.company || '',
                        role: selectedContact.role || '',
                        notes: selectedContact.notes || '',
                        lead_category: selectedContact.lead_category || 'Cliente',
                      })
                      setIsEditing(true)
                    }}
                    className="text-zinc-400 hover:text-secondary transition-colors p-1.5 rounded-xl hover:bg-zinc-55 dark:hover:bg-zinc-900"
                    title="Modifica"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => { setSelectedContact(null); setIsEditing(false); }}
                  className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 transition-colors p-1.5 rounded-xl hover:bg-zinc-55 dark:hover:bg-zinc-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {isEditing ? (
                <div className="space-y-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Nome</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.first_name} onChange={(e) => setEditData({...editData, first_name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Cognome</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.last_name} onChange={(e) => setEditData({...editData, last_name: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Azienda</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.company} onChange={(e) => setEditData({...editData, company: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Ruolo</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Email</label>
                      <input type="email" className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Telefono</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Sito Web</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.website} onChange={(e) => setEditData({...editData, website: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 mb-1 block">Indirizzo</label>
                      <input className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-2 block">Categoria Lead</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Business Partner", "Casa Auto", "Cliente", "Dealer", 
                        "Distributore Estero", "Distributore Italia", "Fornitore", 
                        "Installatore", "Prospect", "Rivenditore", "Segnalatore", "Altro"
                      ].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditData({...editData, lead_category: cat})}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                            editData.lead_category === cat
                              ? 'bg-secondary text-white border-secondary shadow-sm' 
                              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 mb-1 block">Note</label>
                    <textarea rows={3} className="w-full p-2 border rounded-md text-sm bg-transparent border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-secondary outline-none" value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} />
                  </div>
                </div>
              ) : (
                <>
                  {/* Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={selectedContact.email} isLink href={`mailto:${selectedContact.email}`} />
                      <DetailRow icon={<Phone className="h-4 w-4" />} label="Telefono" value={selectedContact.phone} isLink href={`tel:${selectedContact.phone}`} />
                      <DetailRow icon={<Globe className="h-4 w-4" />} label="Sito Web" value={selectedContact.website} isLink href={selectedContact.website ? (selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`) : ''} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="Indirizzo" value={selectedContact.address} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="Città" value={selectedContact.metadata?.city} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="Provincia" value={selectedContact.metadata?.province} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="CAP" value={selectedContact.metadata?.postal_code} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="Regione" value={selectedContact.metadata?.region} />
                      <DetailRow icon={<MapPin className="h-4 w-4" />} label="Nazione" value={selectedContact.metadata?.country} />
                      <DetailRow icon={<Building2 className="h-4 w-4" />} label="Partita Iva" value={selectedContact.metadata?.vat_number} />
                      <DetailRow icon={<Calendar className="h-4 w-4" />} label="Acquisito il" value={new Date(selectedContact.created_at).toLocaleString('it-IT')} />
                      <DetailRow icon={<Activity className="h-4 w-4" />} label="Stato Contatto" value={
                        selectedContact.status === 'new' ? 'Nuovo' :
                        selectedContact.status === 'contacted' ? 'Contattato' :
                        selectedContact.status === 'follow-up' ? 'Follow-up' :
                        selectedContact.status === 'client' ? 'Cliente' : selectedContact.status || 'Nuovo'
                      } />
                      <DetailRow icon={<Sparkles className="h-4 w-4" />} label="Fonte" value={
                        selectedContact.scan_source === 'ocr' ? 'Scansione Ottica (OCR)' :
                        selectedContact.scan_source === 'qr' ? 'Codice QR' :
                        selectedContact.scan_source === 'ocr/qr' ? 'Scansione Biglietto / QR' :
                        selectedContact.scan_source === 'manual' ? 'Inserimento Manuale' : selectedContact.scan_source || 'Inserimento Manuale'
                      } />
                      {selectedContact.interest && (
                        <DetailRow icon={<Tag className="h-4 w-4" />} label="Interesse" value={selectedContact.interest} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                        <span>Categoria:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400`}>
                          {selectedContact.lead_category}
                        </span>
                      </div>
                      {selectedContact.metadata?.business_line && selectedContact.metadata.business_line.length > 0 && (
                        <>
                          <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                            <span>Linea:</span>
                            {selectedContact.metadata.business_line.map((line: string) => (
                              <span key={line} className={`px-2 py-0.5 rounded-full font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400`}>
                                {line}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span>HubSpot:</span>
                        {selectedContact.hubspot_id ? (
                          <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3.5 w-3.5" /> Sincronizzato
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3.5 w-3.5" /> Non Sincronizzato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note e Interessi */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Note / Interessi
                    </h4>
                    <div className="text-sm bg-zinc-55 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 italic text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {selectedContact.notes || 'Nessuna nota aggiuntiva.'}
                    </div>
                  </div>
                </>
              )}

              {/* Business Card Image */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Biglietto da Visita
                </h4>
                {selectedContact.attachments && selectedContact.attachments.length > 0 ? (
                  <div className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-zinc-950 aspect-[3/2] flex items-center justify-center shadow-inner relative group max-w-md mx-auto">
                    {modalImageError ? (
                      <div className="text-zinc-400 text-center p-4 space-y-1.5">
                        <span className="text-2xl">📱</span>
                        <h4 className="text-xs font-bold text-zinc-100">Anteprima non supportata</h4>
                        <p className="text-[10px] max-w-[180px] leading-relaxed mx-auto">
                          Il browser non supporta la visualizzazione di questo formato (es. HEIC/Apple).
                        </p>
                      </div>
                    ) : (
                      <img 
                        src={selectedContact.attachments[0].file_url} 
                        alt="Biglietto Scansionato" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => setModalImageError(true)}
                      />
                    )}
                    <a 
                      href={selectedContact.attachments[0].file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 aspect-[3/2] flex flex-col items-center justify-center text-center p-4 bg-zinc-50 dark:bg-zinc-800/30 text-zinc-400 max-w-md mx-auto">
                    <Camera className="h-7 w-7 mb-1.5 text-zinc-300" />
                    <p className="text-xs font-medium">Nessun allegato per questo contatto.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-4">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl font-semibold text-xs"
                    disabled={saving}
                  >
                    Annulla
                  </Button>
                  <Button 
                    variant="secondary"
                    className="font-bold rounded-xl text-xs bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Salva
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedContact(null)}
                    className="rounded-xl font-semibold text-xs"
                  >
                    Chiudi
                  </Button>
                  {!selectedContact.hubspot_id && (
                    <Button 
                      variant="secondary"
                      className="font-bold rounded-xl text-xs bg-secondary hover:bg-secondary/90 text-white"
                      onClick={() => handleSync(selectedContact.id)}
                      disabled={syncingId !== null}
                    >
                      {syncingId === selectedContact.id ? 'Sincronizzazione...' : 'Sincronizza HubSpot'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({ icon, label, value, isLink, href }: { icon: React.ReactNode, label: string, value?: string, isLink?: boolean, href?: string }) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-zinc-400 mt-0.5">{icon}</div>
      <div>
        <span className="text-xs font-bold text-zinc-400 block">{label}</span>
        {isLink && href ? (
          <a href={href} className="text-secondary hover:underline font-medium break-all">
            {value}
          </a>
        ) : (
          <span className="text-zinc-800 dark:text-zinc-200 font-medium break-all">{value}</span>
        )}
      </div>
    </div>
  )
}
