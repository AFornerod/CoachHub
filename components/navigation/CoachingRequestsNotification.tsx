'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CoachingRequestsNotification() {
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadPendingCount()

    // Actualizar cada 30 segundos
    const interval = setInterval(loadPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadPendingCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const { count } = await supabase
        .from('coaching_requests')
        .select('*', { count: 'exact', head: true })
        .eq('coach_profile_id', profile.id)
        .eq('status', 'pending')

      setPendingCount(count || 0)
    } catch (error) {
      console.error('Error loading pending requests:', error)
    }
  }

  if (pendingCount === 0) {
    return (
      <Link href="/dashboard/coaching-requests">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/dashboard/coaching-requests">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {pendingCount > 9 ? '9+' : pendingCount}
        </Badge>
      </Button>
    </Link>
  )
}
