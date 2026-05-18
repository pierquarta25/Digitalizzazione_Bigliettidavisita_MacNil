'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Credenziali non valide. Riprova.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Bentornato</h1>
            <p className="mt-2 text-zinc-500">Accedi per gestire i tuoi contatti</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Non hai un account? Contatta il tuo amministratore.
          </p>
        </div>
      </main>
    </div>
  )
}
