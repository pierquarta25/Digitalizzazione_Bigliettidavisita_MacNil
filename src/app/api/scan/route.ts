import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { processImageWithGemini } from '@/lib/actions/ocr'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'Immagine mancante' }, { status: 400 })
    }

    const data = await processImageWithGemini(image)

    if (!data) {
      return NextResponse.json({ error: "Errore durante l'elaborazione dell'immagine" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API Scan Error:', error)
    return NextResponse.json({ error: error.message || 'Errore interno del server' }, { status: 500 })
  }
}
