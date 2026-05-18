'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from './ui/Button'
import { XCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    )

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText)
        if (scannerRef.current) {
          scannerRef.current.clear()
        }
      },
      (errorMessage) => {
        // Opzionale: logga errori di scansione (molto frequenti)
        // console.warn(errorMessage)
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Failed to clear scanner', err))
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <XCircle className="h-8 w-8" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center">Inquadra il QR Code</h2>
        
        <div id="qr-reader" className="w-full"></div>
        
        {error && (
          <p className="mt-4 text-red-500 text-center text-sm">{error}</p>
        )}

        <Button 
          variant="outline" 
          className="mt-8 w-full"
          onClick={onClose}
        >
          Annulla
        </Button>
      </div>
    </div>
  )
}
