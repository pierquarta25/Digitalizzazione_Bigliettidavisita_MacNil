'use server'

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

async function generateContentWithRetry(model: any, content: any, maxAttempts = 5): Promise<any> {
  let attempt = 0
  while (attempt < maxAttempts) {
    try {
      return await model.generateContent(content)
    } catch (error: any) {
      attempt++
      const isTransient = 
        !error.status ||
        error.status === 503 || 
        error.status === 429 || 
        error.status === 500 ||
        (error.message && /429|503|500|resource|exhausted|quota|limit|unavailable|overload|service/i.test(error.message))
      
      console.warn(`Tentativo API Gemini ${attempt} fallito:`, error.message || error)
      if (attempt >= maxAttempts || !isTransient) {
        throw error
      }
      const baseDelay = Math.pow(2, attempt) * 1000
      const jitter = Math.random() * 1000
      const delay = baseDelay + jitter
      console.log(`Attesa di ${Math.round(delay)}ms prima del tentativo ${attempt + 1}...`)
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
    model: 'gemini-3.5-flash',
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
          city: { type: SchemaType.STRING },
          province: { type: SchemaType.STRING },
          postal_code: { type: SchemaType.STRING },
          region: { type: SchemaType.STRING },
          country: { type: SchemaType.STRING },
          vat_number: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING }
        },
        required: ['first_name', 'last_name', 'company', 'role', 'email', 'phone', 'website', 'address', 'city', 'province', 'postal_code', 'region', 'country', 'vat_number', 'notes']
      }
    }
  })

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/)
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg'
  const base64Data = base64Image.split(',')[1] || base64Image

  const prompt = `
    Sei un sistema OCR avanzato specializzato nella digitalizzazione ad alta precisione di biglietti da visita.
    Analizza l'immagine fornita ed estrai le informazioni di contatto.

    REGOLE CRITICHE DI ESTRAZIONE:
    1. NOME E COGNOME (first_name, last_name):
       - Identifica il nome e il cognome dell'individuo.
       - Dividi accuratamente il Nome (first_name) dal Cognome (last_name).
       - Se ci sono più nomi (es. "Gian Maria"), inseriscili tutti in 'first_name'.
       - Se è impossibile distinguerli con certezza, metti l'intero blocco in 'first_name' e lascia 'last_name' vuoto ("").
    
    2. AZIENDA (company):
       - Identifica il nome dell'azienda (cerca loghi o scritte in evidenza).
       - Verifica anche il dominio dell'indirizzo email o del sito web per confermare il nome dell'azienda (es. se l'email è "mario.rossi@macnil.it", l'azienda è molto probabilmente "MacNil").

    3. RUOLO (role):
       - Cerca la qualifica professionale (es. "Amministratore Delegato", "Project Manager", "Account Executive", "Socio", "Consulente").
       - Di solito è posizionato vicino al nome della persona.

    4. EMAIL (email):
       - Identifica l'indirizzo email. Rimuovi spazi e correggi ovvi errori di scansione dell'OCR (es. "gmai1.com" in "gmail.com").

    5. TELEFONO (phone):
       - Estrai il numero di telefono (cellulare o fisso), includendo il prefisso internazionale se presente (es. "+39").
       - Mantieni una formattazione pulita e leggibile. Se ci sono più numeri, separali con una virgola.

    6. SITO WEB (website):
       - Cerca l'indirizzo internet (es. "www.macnil.it").

    7. INDIRIZZO E LUOGHI (address, city, province, postal_code, region, country):
       - 'address': Inserisci SOLO la via (e numero civico), senza CAP o città.
       - 'city': Inserisci SOLO la città.
       - 'province': Se la individui, scrivi la sigla e il nome nel formato esatto "SIGLA - Nome" (es. "BA - Bari"). Altrimenti stringa vuota.
       - 'postal_code': Inserisci il codice postale/CAP.
       - 'region': Inserisci la regione.
       - 'country': Inserisci la nazione.

    8. PARTITA IVA E CODICE FISCALE (vat_number):
       - Estrai la Partita IVA (PIVA) o il Codice Fiscale dell'azienda, se presenti.

    9. NOTE (notes):
       - Inserisci SOLO informazioni utili aggiuntive presenti sul biglietto che non rientrano nei campi precedenti (es. profili social come LinkedIn, orari, servizi offerti, slogan).
       - NON duplicare informazioni già estratte in altri campi.

    LINEE GUIDA GENERALI PER L'ACCURATEZZA:
    - Sii estremamente preciso. Non inventare o allucinare informazioni.
    - Se un campo non è presente nel biglietto da visita o non è leggibile, restituisci una stringa vuota ("") per quel campo.
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
    const isQuotaOrOverload = 
      error.status === 503 || 
      error.status === 429 || 
      (error.message && /429|503|resource|exhausted|quota|limit|unavailable|overload/i.test(error.message))
      
    if (isQuotaOrOverload) {
      throw new Error('Il servizio di lettura automatica dei contatti è momentaneamente sovraccarico o ha esaurito la quota. Riprova tra qualche istante.')
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
    model: 'gemini-3.5-flash',
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
          city: { type: SchemaType.STRING },
          province: { type: SchemaType.STRING },
          postal_code: { type: SchemaType.STRING },
          region: { type: SchemaType.STRING },
          country: { type: SchemaType.STRING },
          vat_number: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING }
        },
        required: ['first_name', 'last_name', 'company', 'role', 'email', 'phone', 'website', 'address', 'city', 'province', 'postal_code', 'region', 'country', 'vat_number', 'notes']
      }
    }
  })

  const prompt = `
    Sei un sistema di analisi dati specializzato nella formattazione di testi OCR di biglietti da visita.
    Analizza il testo fornito ed estrai le informazioni di contatto in modo estremamente accurato.
    Testo da analizzare: "${rawText}"

    REGOLE CRITICHE:
    1. Dividi accuratamente Nome (first_name) e Cognome (last_name).
    2. Identifica l'Azienda (company), il Ruolo (role), l'Email (email), il Telefono (phone) e il Sito Web (website).
    3. Per i dati geografici dividi in: 'address' (via), 'city', 'province' (formato esatto "SIGLA - Nome", es. "BA - Bari"), 'postal_code', 'region', 'country'.
    4. Identifica la Partita IVA in 'vat_number'.
    5. Inserisci in 'notes' solo dati secondari utili (LinkedIn, slogan) senza duplicare i campi precedenti.
    6. Se un campo non è presente o non è identificabile nel testo, restituisci una stringa vuota (""). Non allucinare dati.
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
