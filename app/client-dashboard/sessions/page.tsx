'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Session {
  id: string
  title: string
  scheduled_date: string
  duration: number
  status: string
  session_type: string
  notes: string
  coach_id: string
  coach_profile: {
    display_name: string
    avatar_url: string
    user_id: string
  }
}

export default function ClientSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [coachFilter, setCoachFilter] = useState('all')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchTerm, statusFilter, coachFilter])

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Obtener client_id
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!clientRecord) {
        console.error('No client record found')
        setIsLoading(false)
        return
      }

      // Obtener todas las sesiones
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientRecord.id)
        .order('scheduled_date', { ascending: false })

      if (error) {
        console.error('Error loading sessions:', error)
      } else if (sessionsData) {
        // Obtener coach profiles
        const coachIds = [...new Set(sessionsData.map(s => s.coach_id))]
        const { data: coachProfiles } = await supabase
          .from('coach_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', coachIds)

        const sessionsWithCoaches = sessionsData.map(session => ({
          ...session,
          coach_profile: coachProfiles?.find(cp => cp.user_id === session.coach_id) || {
            user_id: session.coach_id,
            display_name: 'Coach',
            avatar_url: null
          }
        }))

        setSessions(sessionsWithCoaches)
        setFilteredSessions(sessionsWithCoaches)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterSessions() {
    let filtered = [...sessions]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.coach_profile.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    // Filter by coach - CORREGIDO: usar user_id en lugar de display_name
    if (coachFilter !== 'all') {
      filtered = filtered.filter(session => session.coach_id === coachFilter)
    }

    setFilteredSessions(filtered)
  }

  const getStatusBadge = (status: string) => {
    const config = {
      scheduled: { 
        label: 'Programada', 
        icon: Clock,
        className: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      completed: { 
        label: 'Completada', 
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      cancelled: { 
        label: 'Cancelada', 
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200'
      },
      'in-progress': { 
        label: 'En Progreso', 
        icon: AlertCircle,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      }
    }
    const { label, icon: Icon, className } = config[status as keyof typeof config] || config.scheduled
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const uniqueCoaches = Array.from(
    new Map(sessions.map(s => [s.coach_id, s.coach_profile])).values()
  )

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/client-dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Mis Sesiones</h1>
        <p className="text-slate-600 mt-1">
          {filteredSessions.length} sesione{filteredSessions.length !== 1 ? 's' : ''} encontrada{filteredSessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-slate-600 mt-1">Completadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              <p className="text-sm text-slate-600 mt-1">Programadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-slate-600 mt-1">Canceladas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título o coach..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programadas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
              </SelectContent>
            </Select>

            {uniqueCoaches.length > 1 && (
              <Select value={coachFilter} onValueChange={setCoachFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los coaches</SelectItem>
                  {uniqueCoaches.map((coach) => (
                    <SelectItem 
                      key={coach.user_id} 
                      value={coach.user_id}
                    >
                      {coach.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No se encontraron sesiones
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm || statusFilter !== 'all' || coachFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no tienes sesiones programadas'}
              </p>
              {sessions.length === 0 && (
                <Link href="/marketplace">
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Coaches
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Link key={session.id} href={`/client-dashboard/sessions/${session.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12 mt-1">
                        <AvatarImage src={session.coach_profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials(session.coach_profile?.display_name || 'C')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {session.title || 'Sesión de Coaching'}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {session.coach_profile?.display_name}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.scheduled_date), "d 'de' MMM, yyyy", { locale: es })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(session.scheduled_date), 'HH:mm')} • {session.duration} min
                          </div>
                        </div>
                        
                        {session.notes && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {getStatusBadge(session.status)}
                      <Badge variant="outline" className="text-xs capitalize">
                        {session.session_type || 'Individual'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
