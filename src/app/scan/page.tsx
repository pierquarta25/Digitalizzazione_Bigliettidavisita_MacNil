'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Camera, QrCode, Upload, ArrowLeft, Loader2, Sliders, Sun, RotateCw, Sparkles, X, AlertCircle, Keyboard } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseVCard } from '@/utils/parser'
import dynamic from 'next/dynamic'

const LiveQRScanner = dynamic(() => import('@/components/LiveQRScanner'), {
  ssr: false
})

// Helper per ottimizzare la lettura dei QR code da foto statiche
const preprocessQRCodeImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Dimensioni ideali per decodificare QR: max 600px
        const maxDim = 600
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height

        // Grayscale + Contrasto elevato rendono il QR molto più facile da leggere per l'algoritmo
        ctx.filter = 'contrast(160%) grayscale(100%)'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], "processed_qr.jpg", { type: "image/jpeg" }))
          } else {
            resolve(file)
          }
        }, 'image/jpeg', 0.9)
      } catch (e) {
        console.error("Errore preprocess QR:", e)
        resolve(file)
      }
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

export default function ScanPage() {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')

  // Stati per il pre-processing dell'immagine
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [isHeic, setIsHeic] = useState(false)
  const [contrast, setContrast] = useState(0) // -50 a 100
  const [brightness, setBrightness] = useState(0) // -50 a 50
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [scanType, setScanType] = useState<'card' | 'qr'>('card')

  // Supporto fotocamera live
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null)
  const [showLiveScanner, setShowLiveScanner] = useState(false)

  useEffect(() => {
    const checkCameraSupport = () => {
      // Controlla se siamo in un contesto sicuro (HTTPS o localhost)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
      
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      
      setIsCameraAvailable(isSecure && hasMediaDevices)
    }
    
    checkCameraSupport()
  }, [])

  // Gestione del risultato della scansione QR
  const handleLiveScan = (decodedText: string) => {
    let parsedData = {}
    if (decodedText.toUpperCase().includes('BEGIN:VCARD')) {
      parsedData = parseVCard(decodedText)
    } else {
      parsedData = { website: decodedText, notes: 'Scansionato da QR: ' + decodedText }
    }
    goToManualEntry(parsedData)
  }

  // Gestione caricamento file e avvio pre-processing con supporto HEIC
  const handleImageSelection = async (e: React.ChangeEvent<HTMLInputElement>, type: 'card' | 'qr') => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setStatus(type === 'qr' ? 'Lettura QR Code...' : 'Caricamento immagine biglietto...')

    let delegated = false

    try {
      // Pulisce l'eventuale URL blob precedente per liberare memoria
      if (selectedImage && selectedImage.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage)
      }

      // Riconoscimento formato Apple HEIC/HEIF
      const isHeicFile = file.name.toLowerCase().endsWith('.heic') || 
                         file.name.toLowerCase().endsWith('.heif') || 
                         file.type === 'image/heic' || 
                         file.type === 'image/heif'

      setIsHeic(isHeicFile)
      setCurrentFile(file)
      setScanType(type)

      if (isHeicFile) {
        // Converte HEIC lato client in JPEG per abilitare il pre-processing visuale
        try {
          setStatus('Conversione immagine Apple (HEIC) in corso...')
          const heic2any = (await import('heic2any')).default
          const converted = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          })
          const blob = Array.isArray(converted) ? converted[0] : converted
          const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" })
          setCurrentFile(convertedFile)
          setIsHeic(false) // Gestibile ora su Canvas

          if (type === 'qr') {
            setStatus('Ottimizzazione QR Code...')
            try {
              const processedFile = await preprocessQRCodeImage(convertedFile)
              setStatus('Scansione QR Code in corso...')
              const { Html5Qrcode } = await import('html5-qrcode')
              const html5QrCode = new Html5Qrcode("qr-file-reader")
              const decodedText = await html5QrCode.scanFile(processedFile, false)
              handleLiveScan(decodedText)
              return
            } catch (qrErr) {
              console.warn("Decodifica immediata HEIC fallita, apertura editor:", qrErr)
              const blobUrl = URL.createObjectURL(blob)
              setSelectedImage(blobUrl)
            }
          } else {
            const blobUrl = URL.createObjectURL(blob)
            delegated = true
            processAndUpload(blobUrl, 0, 0, 0, false, convertedFile, 'card')
          }
        } catch (heicErr) {
          console.error("Errore conversione HEIC:", heicErr)
          // Fallback a invio diretto del file originale
          delegated = true
          uploadOriginalFile(file)
        }
      } else {
        if (type === 'qr') {
          setStatus('Ottimizzazione QR Code...')
          try {
            const processedFile = await preprocessQRCodeImage(file)
            setStatus('Scansione QR Code in corso...')
            const { Html5Qrcode } = await import('html5-qrcode')
            const html5QrCode = new Html5Qrcode("qr-file-reader")
            const decodedText = await html5QrCode.scanFile(processedFile, false)
            handleLiveScan(decodedText)
            return
          } catch (qrErr) {
            console.warn("Decodifica immediata fallita, apertura editor:", qrErr)
            const blobUrl = URL.createObjectURL(file)
            setSelectedImage(blobUrl)
          }
        } else {
          const blobUrl = URL.createObjectURL(file)
          delegated = true
          processAndUpload(blobUrl, 0, 0, 0, false, file, 'card')
        }
      }

      setContrast(0)
      setBrightness(0)
      setRotation(0)
    } catch (error: any) {
      console.error('Error handling file selection:', error)
      alert("Impossibile caricare l'immagine. Assicurati che sia un formato valido (JPEG, PNG, HEIC).")
    } finally {
      if (!delegated) {
        setProcessing(false)
        setStatus('')
      }
    }
  }

  // Chiude l'editor rilasciando le risorse
  const handleCloseEditor = () => {
    if (selectedImage && selectedImage.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImage)
    }
    setSelectedImage(null)
    setCurrentFile(null)
    setIsHeic(false)
  }

  // Invia il file originale (usato per HEIC o come fallback se il Canvas fallisce)
  const uploadOriginalFile = async (fileToUpload: File) => {
    setProcessing(true)
    setStatus('Lettura file in corso...')
    try {
      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      }
      const originalBase64 = await readFileAsBase64(fileToUpload)
      
      setSelectedImage(null)
      setCurrentFile(null)
      setIsHeic(false)
      setStatus('Rilevamento dati dal biglietto in corso...')
      
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: originalBase64 })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Errore durante l\'analisi dell\'immagine')
      }

      const extractedData = await res.json()

      try {
        sessionStorage.setItem('scannedCardImage', originalBase64)
      } catch (e) {
        console.warn('SessionStorage quota ecceduta.', e)
      }

      goToManualEntry(extractedData)
    } catch (error: any) {
      console.error('OCR Error:', error)
      alert(error.message || 'Errore durante l\'analisi dell\'immagine. Riprova.')
    } finally {
      setProcessing(false)
      setStatus('')
    }
  }

  // Esegue il bake dei filtri su Canvas, comprime e invia all'API o esegue la decodifica QR
  const processAndUpload = (
    imageSrc: string, 
    currentContrast: number, 
    currentBrightness: number, 
    currentRotation: number,
    overrideIsHeic?: boolean,
    overrideFile?: File | null,
    overrideScanType?: 'card' | 'qr'
  ) => {
    const activeIsHeic = overrideIsHeic !== undefined ? overrideIsHeic : isHeic
    const activeFile = overrideFile !== undefined ? overrideFile : currentFile
    const activeScanType = overrideScanType !== undefined ? overrideScanType : scanType

    if (activeIsHeic && activeFile) {
      if (activeScanType === 'qr') {
        alert("La decodifica diretta di QR Code in formato HEIC non è supportata dal browser. Converti il file in JPEG/PNG o scatta una foto in tempo reale.")
        return
      }
      uploadOriginalFile(activeFile)
      return
    }

    setProcessing(true)
    setStatus(activeScanType === 'qr' ? 'Lettura e analisi del QR Code...' : 'Elaborazione dell\'immagine in corso...')
    
    const img = new Image()
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Impossibile ottenere il contesto 2D del Canvas')

        // Calcola dimensioni finali in base alla rotazione
        const isRotated90or270 = currentRotation === 90 || currentRotation === 270
        const width = isRotated90or270 ? img.height : img.width
        const height = isRotated90or270 ? img.width : img.height

        // Limita le dimensioni per ottimizzare il payload (max 800px per biglietto, 600px per QR)
        const maxDim = activeScanType === 'qr' ? 600 : 800
        let scale = 1
        if (Math.max(width, height) > maxDim) {
          scale = maxDim / Math.max(width, height)
        }

        canvas.width = width * scale
        canvas.height = height * scale

        // Applica rotazione e ridimensionamento
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((currentRotation * Math.PI) / 180)

        const drawWidth = isRotated90or270 ? canvas.height : canvas.width
        const drawHeight = isRotated90or270 ? canvas.width : canvas.height

        // Applica filtri contrasto/luminosità tramite API Canvas (CSS filter) se supportato
        const contrastPercent = 100 + currentContrast
        const brightnessPercent = 100 + currentBrightness
        ctx.filter = `contrast(${contrastPercent}%) brightness(${brightnessPercent}%)`

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

        // Se è scansione QR Code:
        if (activeScanType === 'qr') {
          canvas.toBlob(async (blob) => {
            if (!blob) {
              alert("Errore durante l'elaborazione dell'immagine per la scansione QR.")
              setProcessing(false)
              setStatus('')
              return
            }
            try {
              const file = new File([blob], "qr_code.jpg", { type: "image/jpeg" })
              const { Html5Qrcode } = await import('html5-qrcode')
              const html5QrCode = new Html5Qrcode("qr-file-reader")
              const decodedText = await html5QrCode.scanFile(file, false)
              
              // Rilascia l'URL blob per liberare memoria prima di procedere
              if (imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc)
              }

              setSelectedImage(null)
              setCurrentFile(null)
              
              handleLiveScan(decodedText)
            } catch (err) {
              console.error("Scansione QR fallita:", err)
              alert("Nessun codice QR valido rilevato. Prova a ruotare l'immagine o regolare contrasto e luminosità affinché il codice sia ben visibile e a fuoco.")
              setSelectedImage(imageSrc) // Riapre l'editor
            } finally {
              setProcessing(false)
              setStatus('')
            }
          }, 'image/jpeg', 0.9)
          return
        }

        // Se è scansione Biglietto da Visita:
        // Ridotta qualità a 0.7 per dimezzare la dimensione del payload base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)

        // Rilascia l'URL blob per liberare memoria prima di procedere
        if (imageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc)
        }

        // Reset dello stato dell'editor prima della chiamata API
        setSelectedImage(null)
        setCurrentFile(null)
        
        setStatus('Rilevamento dati dal biglietto in corso...')

        // Chiamata all'API Route Handler sicura
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: compressedBase64 })
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Errore durante l\'analisi dell\'immagine')
        }

        const extractedData = await res.json()

        // Salva l'immagine compressa in sessionStorage per mostrarla in manual-entry
        try {
          sessionStorage.setItem('scannedCardImage', compressedBase64)
        } catch (e) {
          console.warn('SessionStorage quota ecceduta, l\'anteprima potrebbe non caricarsi.', e)
        }

        goToManualEntry(extractedData)
      } catch (error: any) {
        console.error('Elaborazione o OCR fallito:', error)
        alert(error.message || 'Errore durante l\'elaborazione dell\'immagine. Riprova.')
        setSelectedImage(imageSrc) // Riapre l'editor in caso di errore
      } finally {
        setProcessing(false)
        setStatus('')
      }
    }
    img.onerror = () => {
      // Se l'immagine non si carica nel Canvas per l'editor, offriamo l'invio diretto dell'originale
      if (activeFile) {
        const confirmDirect = confirm(
          "L'anteprima non si carica correttamente nel browser. Vuoi provare a inviare l'immagine originale direttamente per l'estrazione dei dati?"
        )
        if (confirmDirect) {
          uploadOriginalFile(activeFile)
          return
        }
      } else {
        alert('Impossibile caricare l\'immagine per l\'elaborazione.')
      }
      
      if (imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc)
      }
      setSelectedImage(null)
      setCurrentFile(null)
      setProcessing(false)
      setStatus('')
    }
    
    // Imposta src dopo aver definito onload e onerror per evitare race conditions su blob/cache
    img.src = imageSrc
  }

  // Reindirizzamento con dati
  const goToManualEntry = (data: any) => {
    const params = new URLSearchParams()
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
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
            <p className="text-zinc-500 italic">Non chiudere l'app, elaborazione dell'immagine in corso...</p>
          </div>
        ) : (          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opzione 1: QR Code */}
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
              <div className="mb-6 rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Scanner QR Code</h2>
              <p className="mb-6 text-zinc-500 text-sm px-4">
                Inquadra un codice QR in tempo reale per importare i contatti istantaneamente.
              </p>

              <div className="flex flex-col gap-3 w-full">
                {/* Bottone Fotocamera in Tempo Reale (Live Streaming) */}
                <Button 
                  className="py-6 bg-primary hover:bg-primary/90 text-white font-bold border-none shadow-lg shadow-primary/15"
                  onClick={() => setShowLiveScanner(true)}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Avvia Scanner
                </Button>
                
                <Link href="/manual-entry" className="w-full block">
                  <Button 
                    variant="outline"
                    className="w-full py-6 font-semibold border-2"
                  >
                    <Keyboard className="mr-2 h-5 w-5" />
                    Inserimento Manuale
                  </Button>
                </Link>
              </div>
            </div>

            {/* Opzione 2: Biglietto da Visita */}
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm text-center">
              <div className="mb-6 rounded-full bg-secondary/10 p-4 dark:bg-secondary/20">
                <Camera className="h-10 w-10 text-secondary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Acquisisci Biglietto</h2>
              <p className="mb-6 text-zinc-500 text-sm px-4">
                Fotografa un biglietto da visita o caricalo dalla tua galleria per estrarre automaticamente i dati del contatto.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                {/* Bottone Fotocamera (Mobile-friendly) */}
                <Button className="relative cursor-pointer overflow-hidden py-6 bg-secondary hover:bg-secondary/90 text-white font-bold border-none">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Scatta foto da fotocamera"
                    onChange={(e) => handleImageSelection(e, 'card')}
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
                    aria-label="Carica immagine da galleria"
                    onChange={(e) => handleImageSelection(e, 'card')}
                  />
                  <Upload className="mr-2 h-5 w-5" />
                  Scegli dalla Galleria
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal per il Pre-processing dell'immagine (Glassmorphism e Premium UI) */}
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 overflow-y-auto backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-zinc-900/90 border border-zinc-800 text-white rounded-3xl overflow-hidden p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={handleCloseEditor}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-7 w-7" />
              </button>
              
              <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${scanType === 'qr' ? 'text-primary' : 'text-secondary'}`}>
                <Sliders className="h-5 w-5" /> {scanType === 'qr' ? 'Ottimizza QR Code' : 'Ottimizza Biglietto'}
              </h2>
              <p className="text-xs text-zinc-400 mb-6">
                {scanType === 'qr' 
                  ? "Regola l'immagine per inquadrare, ruotare e definire meglio il QR Code." 
                  : "Regola l'immagine per renderla più leggibile per il rilevamento automatico dei dati."}
              </p>
              
              {/* Preview Area */}
              <div className="relative w-full aspect-[3/2] bg-black rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center mb-6">
                {selectedImage === 'heic-placeholder' ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 text-center h-full w-full rounded-2xl">
                    <span className="text-4xl mb-3">📱</span>
                    <h4 className="font-bold text-zinc-100">File HEIC (Apple) rilevato</h4>
                    <p className="text-xs text-zinc-400 max-w-xs mt-2 leading-relaxed">
                      {scanType === 'qr'
                        ? "La decodifica diretta di QR Code in formato HEIC non è supportata dal browser. Clicca Annulla e converti il file o usa una foto JPEG."
                        : "I browser non supportano la visualizzazione nativa del formato Apple HEIC. Puoi comunque cliccare su \"Procedi\" per caricare il file originale per l'estrazione dei dati."}
                    </p>
                  </div>
                ) : (
                  <img 
                    src={selectedImage} 
                    alt="Anteprima regolazione" 
                    className="max-h-full max-w-full object-contain transition-all duration-100"
                    style={{
                      filter: `contrast(${100 + contrast}%) brightness(${100 + brightness}%)`,
                      transform: `rotate(${rotation}deg)`
                    }}
                  />
                )}
              </div>
              
              {/* Controls */}
              {!isHeic ? (
                <div className="space-y-5 mb-8">
                  {/* Contrast Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <Sliders className={`h-4 w-4 ${scanType === 'qr' ? 'text-primary' : 'text-secondary'}`} /> Contrasto
                      </span>
                      <span className={`${scanType === 'qr' ? 'text-primary' : 'text-secondary'} font-mono`}>{contrast > 0 ? `+${contrast}` : contrast}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="100" 
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${scanType === 'qr' ? 'accent-primary' : 'accent-secondary'}`}
                    />
                  </div>
                  
                  {/* Brightness Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-zinc-300">
                        <Sun className="h-4 w-4 text-yellow-400" /> Luminosità
                      </span>
                      <span className="text-yellow-400 font-mono">{brightness > 0 ? `+${brightness}` : brightness}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" 
                      max="50" 
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                  </div>
                  
                  {/* Rotation Control */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-zinc-400" /> Orientamento
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                    >
                      Ruota di 90°
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl mb-8 text-center text-xs text-zinc-400 leading-relaxed">
                  {scanType === 'qr'
                    ? "⚠️ Le immagini HEIC non possono essere modificate offline per i QR Code."
                    : "⚠️ Le regolazioni dell'immagine sono disabilitate per i file HEIC. Il file originale verrà inviato direttamente per l'estrazione automatica."}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white py-5 rounded-xl font-bold"
                  onClick={handleCloseEditor}
                >
                  Annulla
                </Button>
                <Button 
                  className={`flex-1 ${scanType === 'qr' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-secondary hover:bg-secondary/90 shadow-secondary/20'} text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2 border-none shadow-lg`}
                  onClick={() => processAndUpload(selectedImage, contrast, brightness, rotation)}
                >
                  <Sparkles className="h-4 w-4 fill-current" /> Procedi
                </Button>
              </div>
            </div>
          </div>
        )}

        <div id="qr-file-reader" className="hidden"></div>
      </main>

      {showLiveScanner && (
        <LiveQRScanner 
          onScan={handleLiveScan}
          onClose={() => setShowLiveScanner(false)}
        />
      )}
    </div>
  )
}
