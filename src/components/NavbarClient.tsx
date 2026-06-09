'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from './ui/Button'
import { Camera, LayoutDashboard, LogOut, LogIn, Menu, X, User } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import Image from 'next/image'

interface NavbarClientProps {
  user: SupabaseUser | null
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Chiude il dropdown se si clicca all'esterno
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#071830]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo Macnil */}
        <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
          <Image 
            src="/logo-macnil-bianco.svg" 
            alt="logo macnil bianco" 
            width={364} 
            height={93} 
            className="h-10 sm:h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigazione desktop centralizzata nel menu profilo */}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            /* Contenitore Dropdown Profilo */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-2 p-2 rounded-xl text-white hover:bg-white/10 border border-white/10 bg-white/5 transition-all active:scale-95"
                aria-label="Menu utente"
              >
                <User className="h-5 w-5 text-secondary" />
                <span className="hidden md:inline text-xs max-w-[150px] truncate font-medium text-zinc-200">
                  {user.email}
                </span>
                <Menu className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Dropdown Menu (Glassmorphism & premium styles) */}
              {isOpen && (
                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-white/10 bg-[#0b2240] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Sezione Profilo Attivo */}
                  <div className="px-4 py-3 border-b border-white/10 bg-white/5 rounded-t-xl">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Profilo attivo</p>
                    <p className="text-sm font-semibold text-white truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Voci di navigazione */}
                  <div className="py-1">
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-secondary" />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      href="/scan" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Camera className="h-4 w-4 text-secondary" />
                      <span>Scansiona Contatto</span>
                    </Link>
                  </div>

                  {/* Pulsante Uscita */}
                  <div className="border-t border-white/10 pt-1.5 mt-1">
                    <form action="/auth/signout" method="post" className="w-full">
                      <button 
                        type="submit" 
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-b-xl transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Esci</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Pulsante Accedi (Trasparente con bordo, evita il riquadro bianco) */
            <Link href="/login">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white transition-colors px-4 rounded-xl border"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Accedi
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
