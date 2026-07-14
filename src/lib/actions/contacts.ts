'use server'

import { createClient } from '@/utils/supabase/server'
import { syncContactToHubSpot } from '@/lib/hubspot'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { encrypt, decrypt } from '@/utils/crypto'

// Schema per sanitizzazione input e prevenzione Injection/Mass Assignment
const contactSchema = z.object({
  first_name: z.string().min(1, 'Nome richiesto'),
  last_name: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  job_title: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  lead_category: z.string().optional(),
}).passthrough(); // Permettiamo altri campi innocui. Quelli sensibili sono filtrati sotto.

export async function createContact(formData: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Devi essere autenticato per salvare un contatto.')
  }

  // Escludiamo campi di sistema o vulnerabili (Prevenzione Mass Assignment IDOR)
  const { cardImage, user_id, team_id, id, hubspot_id, created_at, ...rawContactData } = formData

  // 1. Validazione Zod per Sanitizzazione input
  const validationResult = contactSchema.safeParse(rawContactData)
  if (!validationResult.success) {
    throw new Error('Dati non validi: ' + validationResult.error.message)
  }
  const contactData = validationResult.data

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  console.log('DEBUG RLS INSERT:', {
    userId: user.id,
    profile,
    profileError,
    teamId: profile?.team_id
  })

  // 2. Cifratura (Encryption) dei campi sensibili
  const encryptedContactData = {
    ...contactData,
    email: encrypt(contactData.email as string),
    phone: encrypt(contactData.phone as string),
    notes: encrypt(contactData.notes as string),
  }

  // 3. Salva su Supabase (con dati protetti)
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([
      {
        ...encryptedContactData,
        user_id: user.id,
        team_id: profile?.team_id,
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error('Errore durante il salvataggio su Supabase: ' + error.message)
  }

  // Decifriamo il contatto appena creato per passarlo a hubspot e al client
  const decryptedContact = {
    ...contact,
    email: decrypt(contact.email),
    phone: decrypt(contact.phone),
    notes: decrypt(contact.notes)
  }

  // 4. Salva l'immagine su Supabase Storage e crea l'allegato
  if (cardImage) {
    try {
      try {
        await supabase.storage.createBucket('business-cards', { public: true })
      } catch (bucketErr) {
        // Silenzioso
      }

      const buffer = Buffer.from(cardImage.split(',')[1] || cardImage, 'base64')
      const fileName = `${user.id}/${contact.id}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError.message)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('business-cards')
          .getPublicUrl(fileName)

        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert([
            {
              contact_id: contact.id,
              file_url: publicUrl,
              file_type: 'image/jpeg'
            }
          ])

        if (attachmentError) {
          console.error('Attachment DB Insertion Error:', attachmentError.message)
        }
      }
    } catch (storageErr: any) {
      console.error('Supabase Storage integration failed:', storageErr.message)
    }
  }

  // 5. Sincronizza con HubSpot (Asincrono, non blocca l'utente)
  try {
    const hubspotId = await syncContactToHubSpot(decryptedContact)
    if (hubspotId) {
      await supabase
        .from('contacts')
        .update({ hubspot_id: hubspotId })
        .eq('id', contact.id)
    }
  } catch (err) {
    console.error('HubSpot sync failed in action:', err)
  }

  revalidatePath('/')
  return { success: true, contact: decryptedContact }
}

export async function syncContact(contactId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Non autorizzato')
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (error || !contact) {
    throw new Error('Contatto non trovato o non accessibile.')
  }

  // Decifriamo prima di inviare ad hubspot
  const decryptedContact = {
    ...contact,
    email: decrypt(contact.email),
    phone: decrypt(contact.phone),
    notes: decrypt(contact.notes)
  }

  const hubspotId = await syncContactToHubSpot(decryptedContact)
  if (hubspotId) {
    await supabase
      .from('contacts')
      .update({ hubspot_id: hubspotId })
      .eq('id', contact.id)
    
    revalidatePath('/')
    return { success: true, hubspotId }
  } else {
    throw new Error('Sincronizzazione con HubSpot fallita. Controlla la chiave API.')
  }
}
