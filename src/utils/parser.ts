/**
 * Utility semplice per parsare i dati vCard dai QR code.
 * Segue lo standard vCard 3.0/4.0 in modo basico e "junior-friendly".
 */
export function parseVCard(vcard: string) {
  const result: any = {}
  
  // Mappa dei campi vCard ai nostri campi form
  const map: any = {
    'FN:': 'full_name',
    'N:': 'name_parts',
    'ORG:': 'company',
    'TITLE:': 'role',
    'EMAIL:': 'email',
    'TEL:': 'phone',
    'URL:': 'website',
    'ADR:': 'address'
  }

  const lines = vcard.split(/\r?\n/)
  
  lines.forEach(line => {
    for (const [key, field] of Object.entries(map)) {
      if (line.toUpperCase().startsWith(key)) {
        let value = line.substring(key.length).trim()
        
        // Pulizia vCard (es. TEL;TYPE=WORK:+39...)
        if (line.includes(';')) {
          value = line.split(':')[1]?.trim() || value
        }

        if (field === 'name_parts') {
          // N:Rossi;Mario;;; -> [Rossi, Mario]
          const parts = value.split(';')
          result.last_name = parts[0]
          result.first_name = parts[1]
        } else if (field === 'full_name' && !result.first_name) {
          // Se non abbiamo N:, proviamo a dividere FN:
          const parts = value.split(' ')
          result.first_name = parts[0]
          result.last_name = parts.slice(1).join(' ')
        } else {
          result[field as string] = value
        }
      }
    }
  })

  return result
}

/**
 * Utility per pulire il testo estratto dall'OCR e cercare campi probabili.
 */
export function extractDataFromText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2)
  const result: any = {
    notes: text // Salviamo tutto il testo nelle note come backup
  }

  // Regex semplici per campi comuni
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const phoneRegex = /(\+?\d{1,4}[\s-])?(\(?\d{3}\)?[\s-])?\d{3}[\s-]\d{4,}/
  const urlRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

  lines.forEach(line => {
    // Cerca Email
    const emailMatch = line.match(emailRegex)
    if (emailMatch && !result.email) {
      result.email = emailMatch[0]
    }

    // Cerca Telefono
    const phoneMatch = line.match(phoneRegex)
    if (phoneMatch && !result.phone) {
      result.phone = phoneMatch[0]
    }

    // Cerca Sito Web
    const urlMatch = line.match(urlRegex)
    if (urlMatch && !result.website && !line.includes('@')) {
      result.website = urlMatch[0]
    }
  })

  // Euristiche per Nome e Azienda (molto semplici: prime righe)
  if (lines.length > 0) {
    const firstLine = lines[0].split(' ')
    if (firstLine.length >= 2) {
      result.first_name = firstLine[0]
      result.last_name = firstLine.slice(1).join(' ')
    }
    if (lines.length > 1) {
      result.company = lines[1]
    }
  }

  return result
}
