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

  // 1. Recuperiamo il profilo dell'utente per sapere di che team fa parte
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  // 2. Salva su Supabase
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([
      {
        ...formData,
        user_id: user.id,
        team_id: profile?.team_id, // Associa il contatto al team dell'utente
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error('Errore durante il salvataggio su Supabase: ' + error.message)
  }

  // 2. Sincronizza con HubSpot (Asincrono, non blocca l'utente)
  // In un ambiente reale useremmo una coda, qui facciamo una chiamata diretta
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
