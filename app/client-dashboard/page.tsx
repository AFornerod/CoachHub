'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  Star,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Search,
  Users,
  CalendarDays,
  Target
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CoachProfile {
  user_id: string
  display_name: string
  avatar_url: string
  specializations: string[]
}

interface CoachRelationship {
  id: string
  coach_id: string
  status: string
  start_date: string
  total_sessions_purchased: number
  sessions_completed: number
  sessions_remaining: number
  session_rate: number
  coaching_focus: string
  // Datos del coach agregados manualmente
  coach_display_name?: string
  coach_avatar_url?: string
  coach_specializations?: string[]
}

interface Session {
  id: string
  scheduled_date: string  // ✅ CORREGIDO: era 'date'
  status: string
  session_type: string
  duration: number  // ✅ CORREGIDO: cambié duration_minutes a duration para consistencia
  notes: string
  coach_id: string
  coach_display_name?: string
  coach_avatar_url?: string
}

export default function ClientDashboardPage() {
  const [coaches, setCoaches] = useState<CoachRelationship[]>([])
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalCoaches: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    avgRating: '-'
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      console.log('Loading dashboard for user:', user.id)

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(profile)

      // ✅ CORREGIDO: Primero obtener el client_id de la tabla clients
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

      console.log('Client record:', clientRecord)

      // 1. Obtener relaciones coach-cliente usando client_id correcto
      const { data: relations, error: relError } = await supabase
        .from('coach_client_relationships')
        .select('*')
        .eq('client_id', clientRecord.id)  // ✅ CORREGIDO: usar clientRecord.id
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      console.log('Coach relations:', relations, 'Error:', relError)

      // 2. Si hay relaciones, obtener los perfiles de los coaches
      if (relations && relations.length > 0) {
        const coachIds = relations.map(r => r.coach_id)
        
        const { data: coachProfiles, error: cpError } = await supabase
          .from('coach_profiles')
          .select('user_id, display_name, avatar_url, specializations')
          .in('user_id', coachIds)

        console.log('Coach profiles:', coachProfiles, 'Error:', cpError)

        // Combinar relaciones con perfiles
        const coachesWithProfiles = relations.map(rel => {
          const profile = coachProfiles?.find(cp => cp.user_id === rel.coach_id)
          return {
            ...rel,
            coach_display_name: profile?.display_name || 'Coach',
            coach_avatar_url: profile?.avatar_url || '',
            coach_specializations: profile?.specializations || []
          }
        })

        setCoaches(coachesWithProfiles)
        setStats(prev => ({ ...prev, totalCoaches: coachesWithProfiles.length }))
      }

      // 3. Obtener sesiones recientes usando client_id correcto
      const { data: sessions, error: sessError } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientRecord.id)  // ✅ CORREGIDO: usar clientRecord.id
        .order('scheduled_date', { ascending: false })  // ✅ CORREGIDO: era 'date'
        .limit(5)

      console.log('Sessions:', sessions, 'Error:', sessError)

      if (sessions && sessions.length > 0) {
        // Obtener perfiles de coaches de las sesiones
        const sessionCoachIds = [...new Set(sessions.map(s => s.coach_id))]
        
        const { data: sessionCoachProfiles } = await supabase
          .from('coach_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', sessionCoachIds)

        // Combinar sesiones con perfiles
        const sessionsWithCoaches = sessions.map(session => {
          const coachProfile = sessionCoachProfiles?.find(cp => cp.user_id === session.coach_id)
          return {
            ...session,
            coach_display_name: coachProfile?.display_name || 'Coach',
            coach_avatar_url: coachProfile?.avatar_url || ''
          }
        })

        setRecentSessions(sessionsWithCoaches)

        // Calcular estadísticas
        const completed = sessions.filter(s => s.status === 'completed').length
        const upcoming = sessions.filter(s => 
          s.status === 'scheduled' && new Date(s.scheduled_date) > new Date()  // ✅ CORREGIDO: era s.date
        ).length
        
        setStats(prev => ({
          ...prev,
          completedSessions: completed,
          upcomingSessions: upcoming
        }))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      scheduled: { label: 'Programada', variant: 'default' },
      completed: { label: 'Completada', variant: 'secondary' },
      cancelled: { label: 'Cancelada', variant: 'destructive' },
      'in-progress': { label: 'En Progreso', variant: 'outline' }
    }
    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "d 'de' MMMM, yyyy - HH:mm", { locale: es })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            ¡Hola, {userData?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600">
            Aquí está el resumen de tu progreso de coaching
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCoaches}</p>
                  <p className="text-sm text-slate-600">Coaches Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedSessions}</p>
                  <p className="text-sm text-slate-600">Sesiones Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.upcomingSessions}</p>
                  <p className="text-sm text-slate-600">Próximas Sesiones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                  <p className="text-sm text-slate-600">Calificación Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mis Coaches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Mis Coaches
                  </CardTitle>
                  <CardDescription>
                    Coaches con los que estás trabajando actualmente
                  </CardDescription>
                </div>
                {coaches.length > 0 && (
                  <Link href="/client-dashboard/coaches">
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      Ver todos
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {coaches.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">Aún no tienes coaches contratados</p>
                  <Link href="/marketplace">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Coaches
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {coaches.map((relation) => (
                    <div 
                      key={relation.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={relation.coach_avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getInitials(relation.coach_display_name || 'C')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {relation.coach_display_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {relation.coaching_focus || relation.coach_specializations?.[0] || 'Coaching'}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {relation.sessions_completed} completadas
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {relation.sessions_remaining} restantes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Activo
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          Desde {format(new Date(relation.start_date), "MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mis Sesiones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Mis Sesiones
                  </CardTitle>
                  <CardDescription>
                    Tus sesiones más recientes
                  </CardDescription>
                </div>
                {recentSessions.length > 0 && (
                  <Link href="/client-dashboard/sessions">
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      Ver todas
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No tienes sesiones programadas aún</p>
                  <Link href="/marketplace">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      Explorar Coaches
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <Link 
                      key={session.id}
                      href={`/client-dashboard/sessions/${session.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={session.coach_avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                              {getInitials(session.coach_display_name || 'C')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">
                              {session.coach_display_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {formatSessionDate(session.scheduled_date)}  {/* ✅ CORREGIDO: era session.date */}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(session.status)}
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-none">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                ¡Continúa tu viaje de crecimiento!
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Explora nuestro marketplace y encuentra más coaches que te ayuden a alcanzar tus metas
              </p>
              <Link href="/marketplace">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Search className="w-5 h-5 mr-2" />
                  Explorar Coaches
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
