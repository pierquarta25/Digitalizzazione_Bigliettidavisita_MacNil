import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isDev = process.env.NODE_ENV === 'development'
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: isDev ? {
        secure: false,
        sameSite: 'lax'
      } : {}
    }
  )
}
