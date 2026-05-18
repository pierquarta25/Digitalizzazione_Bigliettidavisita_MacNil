'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export async function processImageWithGemini(base64Image: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    console.error('Gemini API Key missing in .env')
    return null
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Pulizia della stringa base64 (rimuove il prefisso data:image/...)
  const base64Data = base64Image.split(',')[1] || base64Image

  const prompt = `
    Sei un assistente esperto nell'estrazione di dati da biglietti da visita.
    Analizza l'immagine fornita e estrai le informazioni di contatto.
    
    REGOLE CRITICHE:
    1. Estrai Nome, Cognome, Azienda, Ruolo, Email, Telefono, Sito Web e Indirizzo.
    2. Se non riesci a distinguere Nome e Cognome, metti tutto nel campo 'first_name'.
    3. Il campo 'notes' deve contenere SOLO informazioni AGGIUNTIVE che non rientrano negli altri campi (es. slogan, orari, servizi specifici menzionati).
    4. NON inserire nelle 'notes' informazioni che hai già inserito nei campi specifici.
    5. Rispondi esclusivamente con un oggetto JSON valido.

    Struttura JSON richiesta:
    {
      "first_name": "",
      "last_name": "",
      "company": "",
      "role": "",
      "email": "",
      "phone": "",
      "website": "",
      "address": "",
      "notes": ""
    }
  `

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg" // Gemini accetta la maggior parte dei formati comuni
        }
      }
    ])
    
    const response = await result.response
    const text = response.text()
    
    // Pulizia della risposta JSON
    let jsonString = text.trim()
    if (jsonString.includes('```')) {
      const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (match && match[1]) {
        jsonString = match[1]
      }
    }

    return JSON.parse(jsonString)
  } catch (error) {
    console.error('ERRORE GEMINI VISION:', error)
    return null
  }
}

/**
 * Fallback per testo semplice (se l'immagine non è disponibile)
 */
export async function processTextWithGemini(rawText: string) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) return null

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
    Estrai i dati di contatto da questo testo OCR: "${rawText}"
    Rispondi solo con un JSON: {first_name, last_name, company, role, email, phone, website, address, notes}.
    Non duplicare i dati nelle note.
  `

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    let jsonString = text.trim()
    if (jsonString.includes('```')) {
      const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (match && match[1]) jsonString = match[1]
    }
    return JSON.parse(jsonString)
  } catch (error) {
    return null
  }
}
