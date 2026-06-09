import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isDev = process.env.NODE_ENV === 'development'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createBrowserClient(
    url,
    anonKey,
    {
      cookieOptions: isDev ? {
        secure: false,
        sameSite: 'lax'
      } : {}
    }
  )
}
