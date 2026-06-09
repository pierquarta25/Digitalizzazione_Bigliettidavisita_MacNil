'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'

interface LiveQRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export default function LiveQRScanner({ onScan, onClose }: LiveQRScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied' | 'error'>('pending')

  useEffect(() => {
    let isMounted = true
    let html5QrCode: Html5Qrcode | null = null

    const startCamera = async () => {
      // Piccolo ritardo per consentire a eventuali istanze precedenti di rilasciare l'hardware della fotocamera
      await new Promise((resolve) => setTimeout(resolve, 250))
      if (!isMounted) return

      try {
        const elementId = 'live-qr-reader'
        const element = document.getElementById(elementId)
        if (!element) return

        html5QrCode = new Html5Qrcode(elementId)
        html5QrCodeRef.current = html5QrCode

        // Verifica se il contesto del browser è sicuro
        const isSecureContext = window.isSecureContext || 
                               window.location.protocol === 'https:' || 
                               window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1'

        if (!isSecureContext) {
          setPermissionStatus('error')
          setError('Il browser blocca l\'accesso alla fotocamera in tempo reale su connessioni non sicure (HTTP). Per favore avvia il server con "npm run dev:ssl" ed accedi tramite "https://..." (es: https://172.16.192.182:3000) accettando il certificato.')
          return
        }

        // Prova ad avviare direttamente con la fotocamera posteriore tramite facingMode
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              if (isMounted) {
                onScan(decodedText)
                stopAndClose()
              }
            },
            () => {} // Ignora i log di errore per frame falliti
          )
        } catch (firstErr) {
          console.warn('Avvio diretto con facingMode fallito, provo fallback tramite elenco telecamere...', firstErr)
          
          if (!isMounted) return

          // Fallback: Recupera le telecamere disponibili sul dispositivo
          const devices = await Html5Qrcode.getCameras()
          if (!isMounted) return

          if (!devices || devices.length === 0) {
            throw new Error('Nessuna fotocamera rilevata su questo dispositivo.')
          }

          // Cerca una telecamera posteriore (etichette comuni)
          const backDevice = devices.find(device => {
            const label = device.label.toLowerCase()
            return label.includes('back') || 
                   label.includes('rear') || 
                   label.includes('posteriore') ||
                   label.includes('environment') ||
                   label.includes('camera 0') ||
                   label.includes('facing back')
          })

          // Se non la trova, usa l'ultima telecamera disponibile (di solito posteriore su mobile)
          const selectedDevice = backDevice || devices[devices.length - 1]

          await html5QrCode.start(
            selectedDevice.id,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              if (isMounted) {
                onScan(decodedText)
                stopAndClose()
              }
            },
            () => {}
          )
        }

        if (isMounted) {
          setPermissionStatus('granted')
        } else {
          // Se si è smontato mentre si avviava, fermiamolo subito
          if (html5QrCode.isScanning) {
            await html5QrCode.stop()
            html5QrCode.clear()
          }
        }
      } catch (err) {
        console.error('Errore durante l\'avvio di Html5Qrcode:', err)
        if (!isMounted) return
        const errStr = String(err)
        if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
          setPermissionStatus('denied')
          setError('Permesso di accesso alla fotocamera negato. Consenti l\'uso della fotocamera nelle impostazioni del browser.')
        } else {
          setPermissionStatus('error')
          setError('Impossibile accedere alla fotocamera. Assicurati che i permessi siano attivi e che non sia usata da altre app.')
        }
      }
    }

    startCamera()

    return () => {
      isMounted = false
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop()
            .then(() => {
              html5QrCode?.clear()
            })
            .catch((err) => console.error('Errore cleanup scanner:', err))
        }
      }
    }
  }, [onScan])

  const stopAndClose = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop()
      } catch (err) {
        console.error('Errore durante lo stop della fotocamera:', err)
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-between bg-zinc-950/95 text-white p-6 backdrop-blur-md">
      {/* CSS per le animazioni del laser */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.3; }
        }
        .animate-laser {
          animation: scan-laser 2s infinite linear;
        }
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto pt-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold tracking-wider uppercase text-zinc-400">Scanner Attivo</span>
        </div>
        <button 
          onClick={stopAndClose}
          className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-400 hover:text-white" />
        </button>
      </div>

      {/* Area Scansione (Center) */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 max-w-md mx-auto w-full">
        {permissionStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-zinc-400">Richiesta di accesso alla fotocamera in corso...</p>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-red-950/30 border border-red-900/50 rounded-2xl max-w-sm space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-bold text-red-200">Accesso Negato</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Il browser ha bloccato l'accesso alla fotocamera. Per favore, sblocca i permessi dalle impostazioni del browser (es. icona del lucchetto a fianco all'URL) e ricarica la pagina.
            </p>
            <Button variant="outline" className="w-full border-red-900/50 text-red-200 hover:bg-red-950/30" onClick={stopAndClose}>
              Chiudi
            </Button>
          </div>
        )}

        {permissionStatus === 'error' && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/80 border border-zinc-800 rounded-2xl max-w-sm space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-bold text-zinc-200">Errore Fotocamera</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {error || 'Impossibile connettersi alla fotocamera. Assicurati che non sia utilizzata da un\'altra applicazione.'}
            </p>
            <Button variant="outline" className="w-full border-zinc-800 text-zinc-200 hover:bg-zinc-800" onClick={stopAndClose}>
              Chiudi
            </Button>
          </div>
        )}

        {/* Viewport Scansione Live */}
        <div className={`relative w-full aspect-square max-w-[280px] bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl transition-opacity duration-300 ${permissionStatus === 'granted' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
          {/* L'elemento in cui viene renderizzato il video stream */}
          <div id="live-qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
          
          {/* Custom Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/40">
            {/* Cornici angolari del mirino */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md"></div>

            {/* Linea Laser Pulsante */}
            <div className="absolute left-6 right-6 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.8)] animate-laser"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center pb-8 space-y-4">
        {permissionStatus === 'granted' && (
          <>
            <p className="text-sm font-medium text-zinc-300">
              Inquadra il QR code al centro del mirino
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              La scansione inizierà automaticamente non appena il codice sarà a fuoco.
            </p>
          </>
        )}
        <Button 
          variant="ghost" 
          className="text-zinc-400 hover:text-white hover:bg-zinc-900 w-full"
          onClick={stopAndClose}
        >
          Annulla
        </Button>
      </div>
    </div>
  )
}
