'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChatWidget } from '@/components/ai-assistant/ChatWidget'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!userData) {
        router.push('/login')
        return
      }

      setUser(userData)
      setLoading(false)
    }

    loadUser()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        user={{
          name: user.name,
          email: user.email,
          profile_image: user.profile_image,
        }}
      />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <ChatWidget
        coachContext={{
          name: user.name,
          type: user.coaching_type?.[0] || 'Coaching',
          method: user.coaching_method?.[0] || 'General',
        }}
      />
    </div>
  )
}
