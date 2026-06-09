'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

async function generateContentWithRetry(model: any, content: any, maxAttempts = 3): Promise<any> {
  let attempt = 0
  while (attempt < maxAttempts) {
    try {
      return await model.generateContent(content)
    } catch (error: any) {
      attempt++
      const isTransient = error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')))
      console.warn(`Gemini API attempt ${attempt} failed:`, error.message)
      if (attempt >= maxAttempts || !isTransient) {
        throw error
      }
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export async function processImageWithGemini(base64Image: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    throw new Error('Chiave API non configurata in .env')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          first_name: { type: SchemaType.STRING },
          last_name: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          website: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING }
        },
        required: ['first_name', 'last_name', 'company', 'role', 'email', 'phone', 'website', 'address', 'notes']
      }
    }
  })

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/)
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg'
  const base64Data = base64Image.split(',')[1] || base64Image

  const prompt = `
    Sei un assistente esperto nell'estrazione di dati da biglietti da visita.
    Analizza l'immagine fornita e estrai le informazioni di contatto.
    
    REGOLE CRITICHE:
    1. Estrai Nome, Cognome, Azienda, Ruolo, Email, Telefono, Sito Web e Indirizzo.
    2. Se non riesci a distinguere Nome e Cognome, metti tutto nel campo 'first_name'.
    3. Il campo 'notes' deve contenere SOLO informazioni AGGIUNTIVE che non rientrano negli altri campi (es. slogan, orari, servizi specifici menzionati).
    4. NON inserire nelle 'notes' informazioni che hai già inserito nei campi specifici.
  `

  try {
    const result = await generateContentWithRetry(model, [
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ])
    
    const response = await result.response
    const text = response.text()
    
    return JSON.parse(text.trim())
  } catch (error: any) {
    console.error('ERRORE GEMINI VISION:', error)
    if (error.status === 503 || (error.message && error.message.includes('503'))) {
      throw new Error('Il servizio di lettura automatica dei contatti è momentaneamente sovraccarico. Riprova tra qualche istante.')
    }
    throw new Error(error.message || "Impossibile completare la scansione dell'immagine.")
  }
}

export async function processTextWithGemini(rawText: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    throw new Error('Chiave API non configurata in .env')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          first_name: { type: SchemaType.STRING },
          last_name: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
          website: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING }
        },
        required: ['first_name', 'last_name', 'company', 'role', 'email', 'phone', 'website', 'address', 'notes']
      }
    }
  })

  const prompt = `
    Estrai i dati di contatto da questo testo OCR: "${rawText}"
    Non duplicare i dati nelle note.
  `

  try {
    const result = await generateContentWithRetry(model, prompt)
    const text = result.response.text()
    return JSON.parse(text.trim())
  } catch (error: any) {
    console.error('ERRORE GEMINI TEXT:', error)
    return null
  }
}
