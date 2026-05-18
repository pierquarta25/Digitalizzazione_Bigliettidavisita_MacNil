'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { Camera, QrCode, Upload, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import QRScanner from '@/components/QRScanner'

export default function ScanPage() {
  const [showQR, setShowQR] = useState(false)
  const [scannedData, setScannedData] = useState<string | null>(null)

  const handleQRScan = (data: string) => {
    setScannedData(data)
    setShowQR(false)
    // Qui andrà la logica per processare il QR (vCard o link)
    console.log('Scanned QR:', data)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('Uploading for OCR:', file.name)
      // Qui andrà la logica per l'upload e il processing OCR
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/" className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Home
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Acquisisci Nuovo Contatto</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opzione 1: QR Code */}
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
            <div className="mb-6 rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <QrCode className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Scanner QR Code</h2>
            <p className="mb-6 text-zinc-500 text-sm">
              Scansiona il QR code su badge, biglietti da visita digitali o profili LinkedIn.
            </p>
            <Button onClick={() => setShowQR(true)} className="w-full">
              Apri Fotocamera
            </Button>
          </div>

          {/* Opzione 2: OCR / Biglietto da Visita */}
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
            <div className="mb-6 rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
              <Camera className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Scansione Biglietto</h2>
            <p className="mb-6 text-zinc-500 text-sm">
              Scatta una foto a un biglietto da visita fisico per estrarre automaticamente i dati.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button variant="secondary" className="relative cursor-pointer overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Camera className="mr-2 h-4 w-4" />
                Scatta Foto
              </Button>
              <Button variant="outline" className="relative cursor-pointer overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <Upload className="mr-2 h-4 w-4" />
                Carica Immagine
              </Button>
            </div>
          </div>
        </div>

        {/* Risultato (Placeholder) */}
        {scannedData && (
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-600" />
              Dati Rilevati
            </h3>
            <p className="text-sm font-mono break-all">{scannedData}</p>
            <Button className="mt-4" size="sm">
              Crea Contatto
            </Button>
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
