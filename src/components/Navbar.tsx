import Link from 'next/link'
import { Button } from './ui/Button'
import { Camera, Users, LogIn, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-black/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Camera className="h-6 w-6" />
          <span>MacNil Contact</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-blue-600 flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/team" className="text-sm font-medium hover:text-blue-600 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Team
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="outline" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Accedi
            </Button>
          </Link>
          <Link href="/scan">
            <Button size="sm">
              Scansiona
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
