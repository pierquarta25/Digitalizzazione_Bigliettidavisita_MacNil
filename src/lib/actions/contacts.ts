'use server'

import { createClient } from '@/utils/supabase/server'
import { syncContactToHubSpot } from '@/lib/hubspot'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Devi essere autenticato per salvare un contatto.')
  }

  // Estraiamo l'immagine pre-processata se presente
  const { cardImage, ...contactData } = formData

  // 1. Recuperiamo il profilo dell'utente per sapere di che team fa parte
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

  // 2. Salva su Supabase
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([
      {
        ...contactData,
        user_id: user.id,
        team_id: profile?.team_id, // Associa il contatto al team dell'utente
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error('Errore durante il salvataggio su Supabase: ' + error.message)
  }

  // 3. Salva l'immagine su Supabase Storage e crea l'allegato
  if (cardImage) {
    try {
      // Prova a creare il bucket se non esiste (ignora l'errore se esiste già)
      try {
        await supabase.storage.createBucket('business-cards', { public: true })
      } catch (bucketErr) {
        // Silenzioso: potrebbe già esistere o non esserci permessi admin
      }

      // Converte Base64 in Buffer binario
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
        // Ottiene l'URL pubblico
        const { data: { publicUrl } } = supabase.storage
          .from('business-cards')
          .getPublicUrl(fileName)

        // Salva il riferimento nel DB
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

  // 4. Sincronizza con HubSpot (Asincrono, non blocca l'utente)
  try {
    const hubspotId = await syncContactToHubSpot(contact)
    if (hubspotId) {
      await supabase
        .from('contacts')
        .update({ hubspot_id: hubspotId })
        .eq('id', contact.id)
    }
  } catch (err) {
    console.error('HubSpot sync failed in action:', err)
  }

  revalidatePath('/dashboard')
  return { success: true, contact }
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

  const hubspotId = await syncContactToHubSpot(contact)
  if (hubspotId) {
    await supabase
      .from('contacts')
      .update({ hubspot_id: hubspotId })
      .eq('id', contact.id)
    
    revalidatePath('/dashboard')
    return { success: true, hubspotId }
  } else {
    throw new Error('Sincronizzazione con HubSpot fallita. Controlla la chiave API.')
  }
}
