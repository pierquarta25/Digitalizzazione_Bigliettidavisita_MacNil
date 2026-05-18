import Link from 'next/link'
import { Button } from './ui/Button'
import { Camera, Users, LogIn, LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

import Image from 'next/image'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#071830] backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo-macnil-bianco.svg" 
            alt="logo macnil bianco" 
            width={364} 
            height={93} 
            className="h-10 sm:h-12 w-auto object-contain"
            priority
          />
        </Link>


        {user && (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-white hover:text-secondary flex items-center gap-1 transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/team" className="text-sm font-medium text-white hover:text-secondary flex items-center gap-1 transition-colors">
              <Users className="h-4 w-4" />
              Team
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/scan">
                <Button size="sm" className="hidden sm:flex bg-secondary hover:bg-secondary/90 text-white font-bold border-none">
                  Scansiona
                </Button>
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit" className="text-white hover:bg-white/10 hover:text-secondary">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Esci</span>
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
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
