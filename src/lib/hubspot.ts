import axios from 'axios'

const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/contacts'

export async function syncContactToHubSpot(contact: any) {
  const token = process.env.HUBSPOT_TOKEN

  if (!token || token.includes('metti-il-tuo-token')) {
    console.warn('HubSpot token non configurato. Salto la sincronizzazione.')
    return null
  }

  try {
    const response = await axios.post(
      HUBSPOT_API_URL,
      {
        properties: {
          firstname: contact.first_name,
          lastname: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          jobtitle: contact.role,
          lifecyclestage: 'lead',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.id
  } catch (error: any) {
    console.error('Errore durante la sincronizzazione HubSpot:', error.response?.data || error.message)
    return null
  }
}
