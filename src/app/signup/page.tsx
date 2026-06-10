'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Le password non coincidono.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.')
      setLoading(false)
      return
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signupError) {
        throw signupError
      }

      if (data?.session) {
        // Se la conferma email è disattivata, l'utente viene loggato immediatamente
        router.push('/dashboard')
        router.refresh()
      } else {
        // Se la conferma email è attiva, mostriamo il messaggio di successo
        setSuccess(true)
      }
    } catch (err: any) {
      console.error('Signup Error:', err)
      let msg = err.message || 'Si è verificato un errore durante la creazione dell\'account. Riprova.'
      
      // Traduzione e diagnosi degli errori comuni di Supabase
      if (err.code === 'over_email_send_rate_limit' || msg.toLowerCase().includes('rate limit')) {
        msg = 'Limite di invio e-mail di Supabase superato. Per testare la registrazione senza questo blocco, disattiva l\'opzione "Confirm email" (Conferma e-mail) nella console Supabase (Authentication -> Providers -> Email -> disabilita "Confirm email").'
      } else if (msg.toLowerCase().includes('signup') && (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('not allowed'))) {
        msg = 'Le registrazioni autonome sono disabilitate per questo progetto Supabase. Abilitale in Authentication -> Providers -> Email.'
      } else if (msg === 'Email address is invalid') {
        msg = 'L\'indirizzo e-mail inserito non è valido o il dominio è bloccato da Supabase.'
      }
      
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message || 'Impossibile accedere con Google. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border shadow-sm">
          
          <Link href="/login" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna all'accesso
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold">Crea un Account</h1>
            <p className="mt-2 text-zinc-500">Registrati per iniziare a salvare i tuoi contatti</p>
          </div>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl border border-green-100 dark:border-green-900/50">
                <p className="font-bold text-lg mb-1">Registrazione completata!</p>
                <p className="text-sm">
                  Abbiamo inviato un'email di verifica a <strong className="break-all">{email}</strong>.<br />
                  Clicca sul link presente nel messaggio per attivare il tuo profilo ed effettuare l'accesso.
                </p>
              </div>
              <Link href="/login" className="block w-full">
                <Button className="w-full py-4 bg-primary text-white">
                  Vai alla pagina di accesso
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" /> Email
                </label>
                <input 
                  type="email"
                  required
                  className="w-full p-3 border rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="nome@azienda.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-zinc-400" /> Password
                </label>
                <input 
                  type="password"
                  required
                  className="w-full p-3 border rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Scegli una password (min. 6 caratteri)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-zinc-400" /> Conferma Password
                </label>
                <input 
                  type="password"
                  required
                  className="w-full p-3 border rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                <UserPlus className="mr-2 h-5 w-5" />
                {loading ? 'Creazione account in corso...' : 'Registrati'}
              </Button>
            </form>
          )}

          {!success && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Oppure</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-base font-semibold border-zinc-300 dark:border-zinc-850 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Registrati con Google
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Hai già un account?{' '}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                  Accedi qui
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
