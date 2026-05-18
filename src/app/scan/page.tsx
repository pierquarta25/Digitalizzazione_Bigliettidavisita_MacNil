'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Camera, QrCode, Upload, Zap, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRScanner from '@/components/QRScanner'
import { processImageWithGemini } from '@/lib/actions/ocr'

export default function ScanPage() {
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')

  // Gestione scansione QR Code
  const handleQRScan = (data: string) => {
    setShowQR(false)
    let parsedData = {}

    // Verifica se è una vCard
    if (data.toUpperCase().includes('BEGIN:VCARD')) {
      parsedData = parseVCard(data)
    } else {
      // Altrimenti assumiamo sia un URL o testo semplice
      parsedData = { website: data, notes: 'Scansionato da QR: ' + data }
    }

    goToManualEntry(parsedData)
  }

  // Gestione Scansione Biglietto da Visita (Gemini Vision)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setStatus('L\'intelligenza artificiale sta leggendo il biglietto...')

    try {
      // Funzione per leggere il file come stringa base64
      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }

      const imageData = await readFileAsBase64(file)
      
      // Invio diretto a Gemini Vision (molto più accurato di Tesseract)
      const extractedData = await processImageWithGemini(imageData)

      if (extractedData) {
        goToManualEntry(extractedData)
      } else {
        alert('L\'AI non è riuscita a estrarre i dati. Verrai reindirizzato all\'inserimento manuale.')
        goToManualEntry({})
      }
    } catch (error) {
      console.error('OCR Error:', error)
      alert('Errore durante l\'analisi dell\'immagine. Riprova.')
    } finally {
      setProcessing(false)
      setStatus('')
    }
  }


  // Reindirizzamento con dati
  const goToManualEntry = (data: any) => {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        // Limitiamo la lunghezza del testo per evitare URL troppo lunghi (max 500 caratteri per campo)
        const stringValue = String(value).substring(0, 500)
        params.append(key, stringValue)
      }
    })
    router.push(`/manual-entry?${params.toString()}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/" className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Home
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Acquisisci Nuovo Contatto</h1>

        {processing ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-zinc-900 rounded-3xl border shadow-xl text-center">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">{status}</h2>
            <p className="text-zinc-500 italic">Non chiudere l'app, l'IA sta analizzando l'immagine...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opzione 1: QR Code */}
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
              <div className="mb-6 rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Scanner QR Code</h2>
              <p className="mb-6 text-zinc-500 text-sm px-4">
                Inquadra il QR code su badge o biglietti digitali per importare i dati istantaneamente.
              </p>
              <Button onClick={() => setShowQR(true)} className="w-full py-6 font-bold">
                Apri Fotocamera
              </Button>
            </div>

            {/* Opzione 2: OCR / Biglietto da Visita */}
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
              <div className="mb-6 rounded-full bg-secondary/10 p-4 dark:bg-secondary/20">
                <Camera className="h-10 w-10 text-secondary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Acquisisci Biglietto</h2>
              <p className="mb-6 text-zinc-500 text-sm px-4">
                Fotografa un biglietto da visita o caricalo dalla tua galleria per estrarre i dati con l'IA.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                {/* Bottone Fotocamera (Mobile-friendly) */}
                <Button className="relative cursor-pointer overflow-hidden py-6 bg-secondary hover:bg-secondary/90 text-white font-bold border-none">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <Camera className="mr-2 h-5 w-5" />
                  Scatta Foto
                </Button>

                {/* Bottone Importa File */}
                <Button variant="outline" className="relative cursor-pointer overflow-hidden py-6 border-secondary text-secondary hover:bg-secondary/5 font-bold">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <Upload className="mr-2 h-5 w-5" />
                  Scegli dalla Galleria
                </Button>
              </div>
            </div>
          </div>
        )}

        {showQR && (
          <QRScanner 
            onScan={handleQRScan} 
            onClose={() => setShowQR(false)} 
          />
        )}
      </main>
    </div>
  )
}
