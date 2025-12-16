'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, LayoutDashboard, Users, Calendar, DollarSign, Settings, LogOut, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface NavbarProps {
  user: {
    name: string
    email: string
    profile_image?: string
  }
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/sessions', label: 'Sesiones', icon: Calendar },
  { href: '/frameworks', label: 'Evaluaciones', icon: BarChart3 },
  { href: '/payments', label: 'Pagos', icon: DollarSign },
]

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()

      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al cerrar sesión',
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">CoachHub</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Button
                    key={link.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'gap-2',
                      isActive && 'bg-slate-100'
                    )}
                    asChild
                  >
                    <Link href={link.href}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={user.profile_image} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
