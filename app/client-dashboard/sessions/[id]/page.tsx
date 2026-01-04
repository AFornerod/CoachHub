'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  FileText,
  CheckCircle2,
  Target,
  Lightbulb,
  MessageSquare,
  Star,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
// ❌ ELIMINADO: import ClientNavbar from '@/components/navigation/ClientNavbar'
import { useToast } from '@/hooks/use-toast'

interface Session {
  id: string
  title: string
  scheduled_date: string
  duration: number
  status: string
  session_type: string
  location: string
  meeting_url: string
  notes: string
  session_focus: string[]
  techniques_used: string[]
  insights: string[]
  homework_assigned: string[]
  client_notes: string
  client_commitments: string[]
  client_action_items: string[]
  client_reflection: string
  session_rating: number | null
  session_feedback: string
  coach_id: string
  client_id: string
}

interface CoachProfile {
  display_name: string
  avatar_url: string
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [session, setSession] = useState<Session | null>(null)
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // ❌ ELIMINADO: const [userData, setUserData] = useState<any>(null)
  
  // Editable fields
  const [clientNotes, setClientNotes] = useState('')
  const [clientReflection, setClientReflection] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    loadSession()
  }, [params.id])

  async function loadSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 Loading session for user:', user?.email)
      
      if (!user) {
        router.push('/login')
        return
      }

      // ❌ ELIMINADO: setUserData
      // const { data: profile } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', user.id)
      //   .single()
      // setUserData(profile)

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

      // Obtener sesión
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', params.id)
        .eq('client_id', clientRecord.id)
        .single()

      console.log('📅 Session data:', sessionData)
      console.log('❌ Session error:', error)

      if (error) {
        console.error('Error loading session:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la sesión',
        })
        return
      }

      if (!sessionData) {
        console.log('⚠️ No session found')
        toast({
          variant: 'destructive',
          title: 'Sesión no encontrada',
          description: 'No tienes acceso a esta sesión',
        })
        router.push('/client-dashboard/sessions')
        return
      }

      setSession(sessionData)
      setClientNotes(sessionData.client_notes || '')
      setClientReflection(sessionData.client_reflection || '')
      setRating(sessionData.session_rating || 0)
      setFeedback(sessionData.session_feedback || '')

      // Obtener perfil del coach
      const { data: coachData } = await supabase
        .from('coach_profiles')
        .select('display_name, avatar_url')
        .eq('user_id', sessionData.coach_id)
        .single()

      console.log('👨‍🏫 Coach profile:', coachData)

      if (coachData) {
        setCoachProfile(coachData)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!session) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          client_notes: clientNotes,
          client_reflection: clientReflection,
          session_rating: rating || null,
          session_feedback: feedback,
        })
        .eq('id', session.id)

      if (error) {
        const errorMessage = error.message || 'Error desconocido al guardar'
        console.error('Save error:', error)
        throw new Error(errorMessage)
      }

      toast({
        title: '¡Guardado!',
        description: 'Tus notas se han guardado correctamente',
      })

      // Recargar la sesión
      await loadSession()

    } catch (error: any) {
      console.error('Error saving:', error)
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message || 'No se pudieron guardar las notas. Por favor, intenta de nuevo.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      scheduled: { label: 'Programada', variant: 'default' as const, className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completada', variant: 'secondary' as const, className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, className: '' },
      'in-progress': { label: 'En Progreso', variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-700' }
    }
    const { label, variant, className } = config[status as keyof typeof config] || config.scheduled
    return <Badge variant={variant} className={className}>{label}</Badge>
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      // ❌ ELIMINADO: <ClientNavbar user={userData} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      // ❌ ELIMINADO: <ClientNavbar user={userData} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Sesión no encontrada
              </h3>
              <p className="text-slate-600 mb-6">
                No tienes acceso a esta sesión o no existe
              </p>
              <Link href="/client-dashboard/sessions">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Mis Sesiones
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    // ❌ ELIMINADO: <div className="min-h-screen bg-slate-50">
    //   <ClientNavbar user={userData} />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/client-dashboard/sessions">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Sesiones
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {session.title || 'Sesión de Coaching'}
            </h1>
            <div className="flex items-center gap-4 text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.scheduled_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(session.scheduled_date), 'HH:mm')} ({session.duration} min)
              </div>
            </div>
          </div>
          {getStatusBadge(session.status)}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Session Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coach Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información de la Sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={coachProfile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                    {getInitials(coachProfile?.display_name || 'C')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-600">Tu Coach</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {coachProfile?.display_name}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Clock className="h-4 w-4" />
                    Duración
                  </div>
                  <p className="text-slate-900 font-medium">{session.duration} minutos</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <FileText className="h-4 w-4" />
                    Tipo
                  </div>
                  <p className="text-slate-900 font-medium capitalize">{session.session_type || 'Individual'}</p>
                </div>
              </div>

              {session.location && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </div>
                  <p className="text-slate-900">{session.location}</p>
                </div>
              )}

              {session.meeting_url && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Video className="h-4 w-4" />
                    Link de Reunión
                  </div>
                  <Link 
                    href={session.meeting_url} 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {session.meeting_url}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coach Notes */}
          {session.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notas del Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{session.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Session Focus */}
          {session.session_focus && session.session_focus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Enfoque de la Sesión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {session.session_focus.map((focus, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{focus}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {session.insights && session.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Insights y Descubrimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {session.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Homework */}
          {session.homework_assigned && session.homework_assigned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Tareas Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {session.homework_assigned.map((hw, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{hw}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Client Notes */}
        <div className="space-y-6">
          {/* Client Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Notas</CardTitle>
              <CardDescription>
                Tus apuntes personales de la sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-notes">Notas</Label>
                <Textarea
                  id="client-notes"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  rows={6}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="reflection">Reflexión</Label>
                <Textarea
                  id="reflection"
                  value={clientReflection}
                  onChange={(e) => setClientReflection(e.target.value)}
                  placeholder="¿Qué aprendiste? ¿Qué te llevas de esta sesión?"
                  rows={6}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          {session.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Calificación</CardTitle>
                <CardDescription>
                  ¿Cómo fue tu experiencia?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <Label htmlFor="feedback">Comentarios</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Comparte tu experiencia (opcional)"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
    // ❌ ELIMINADO: </div> del wrapper min-h-screen
  )
}
