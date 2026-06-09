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
            <p className="text-center text-sm text-zinc-500">
              Hai già un account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Accedi qui
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
