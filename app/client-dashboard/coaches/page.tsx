'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  CheckCircle2, 
  Calendar,
  ArrowLeft,
  Linkedin,
  Target,
  Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
  coach_display_name?: string
  coach_avatar_url?: string
  coach_specializations?: string[]
  coach_bio?: string
  coach_years_experience?: number
  coach_certifications?: string[]
  coach_linkedin_url?: string
}

export default function ClientCoachesPage() {
  const [coaches, setCoaches] = useState<CoachRelationship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadCoaches()
  }, [])

  async function loadCoaches() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Obtener client_id usando user_id
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

      console.log('Client ID:', clientRecord.id)

      // ✅ SIMPLIFICADO: Obtener relaciones sin foreign key compleja
      const { data: relations, error: relError } = await supabase
        .from('coach_client_relationships')
        .select('*')
        .eq('client_id', clientRecord.id)
        .order('start_date', { ascending: false })

      console.log('Coach relations:', relations, 'Error:', relError)

      if (relError) {
        console.error('Error loading relations:', relError)
        setIsLoading(false)
        return
      }

      if (!relations || relations.length === 0) {
        console.log('No relations found')
        setCoaches([])
        setIsLoading(false)
        return
      }

      // ✅ Obtener perfiles de coaches por separado
      const coachIds = relations.map(r => r.coach_id)
      
      console.log('🔍 Looking for coach IDs:', coachIds)
      
      const { data: coachProfiles, error: cpError } = await supabase
        .from('coach_profiles')
        .select('user_id, display_name, avatar_url, specializations, bio, years_experience, certifications, linkedin_url')
        .in('user_id', coachIds)

      console.log('✅ Coach profiles found:', coachProfiles)
      console.log('❌ Coach profiles error:', cpError)
      
      // 🔍 DIAGNÓSTICO ADICIONAL: Buscar el perfil directamente
      if (!coachProfiles || coachProfiles.length === 0) {
        console.log('⚠️ No profiles found with .in() query, trying direct query...')
        for (const coachId of coachIds) {
          const { data: directProfile, error: directError } = await supabase
            .from('coach_profiles')
            .select('*')
            .eq('user_id', coachId)
            .single()
          
          console.log(`🔍 Direct query for ${coachId}:`, directProfile, directError)
        }
      }

      // ✅ Combinar relaciones con perfiles manualmente
      const coachesWithProfiles = relations.map(rel => {
        const profile = coachProfiles?.find(cp => cp.user_id === rel.coach_id)
        return {
          ...rel,
          coach_display_name: profile?.display_name || 'Coach',
          coach_avatar_url: profile?.avatar_url || '',
          coach_specializations: profile?.specializations || [],
          coach_bio: profile?.bio || '',
          coach_years_experience: profile?.years_experience || 0,
          coach_certifications: profile?.certifications || [],
          coach_linkedin_url: profile?.linkedin_url || ''
        }
      })

      console.log('Final coaches with profiles:', coachesWithProfiles)
      setCoaches(coachesWithProfiles)
      
    } catch (error) {
      console.error('Error:', error)
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
    const config = {
      active: { label: 'Activo', variant: 'default' as const, className: 'bg-green-50 text-green-700 border-green-200' },
      inactive: { label: 'Inactivo', variant: 'secondary' as const, className: '' },
      completed: { label: 'Completado', variant: 'outline' as const, className: '' },
    }
    const { label, variant, className } = config[status as keyof typeof config] || config.active
    return <Badge variant={variant} className={className}>{label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
        <h1 className="text-3xl font-bold text-slate-900">Mis Coaches</h1>
        <p className="text-slate-600 mt-1">
          Coaches con los que has trabajado o estás trabajando
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coaches.filter(c => c.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600">Coaches Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coaches.reduce((sum, c) => sum + (c.sessions_completed || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Sesiones Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {coaches.reduce((sum, c) => sum + (c.sessions_remaining || 0), 0)}
                </p>
                <p className="text-sm text-slate-600">Sesiones Restantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coaches List */}
      {coaches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Aún no tienes coaches
              </h3>
              <p className="text-slate-600 mb-6">
                Explora nuestro marketplace y encuentra el coach perfecto para ti
              </p>
              <Link href="/marketplace">
                <Button>
                  Explorar Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {coaches.map((relation) => (
            <Card key={relation.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                      <AvatarImage src={relation.coach_avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                        {getInitials(relation.coach_display_name || 'C')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">
                        {relation.coach_display_name}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-2">
                        {relation.coach_specializations?.slice(0, 3).map((spec, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(relation.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        Información del Coach
                      </h4>
                      {relation.coach_bio && (
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {relation.coach_bio}
                        </p>
                      )}
                    </div>

                    {relation.coach_years_experience && relation.coach_years_experience > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span>{relation.coach_years_experience} años de experiencia</span>
                      </div>
                    )}

                    {relation.coaching_focus && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Enfoque de Coaching:</p>
                        <p className="text-sm text-slate-700">{relation.coaching_focus}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {relation.coach_linkedin_url && (
                        <Link 
                          href={relation.coach_linkedin_url} 
                          target="_blank"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Button variant="outline" size="sm">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Stats */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Progreso de Coaching
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Inicio de Coaching:</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {format(new Date(relation.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Sesiones Completadas:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {relation.sessions_completed || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Sesiones Restantes:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {relation.sessions_remaining || 0}
                        </span>
                      </div>

                      {relation.total_sessions_purchased > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-600">Total Contratadas:</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {relation.total_sessions_purchased}
                          </span>
                        </div>
                      )}
                    </div>

                    {relation.status === 'active' && (
                      <Link href={`/marketplace/coaches/${relation.coach_id}`}>
                        <Button className="w-full" variant="outline">
                          Ver Perfil Completo
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
