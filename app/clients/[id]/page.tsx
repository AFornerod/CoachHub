'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Phone, Calendar, Target, FileText, ArrowLeft, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadClientDetails() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .eq('coach_id', user.id)
        .maybeSingle()

      if (!client) {
        router.push('/clients')
        return
      }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', params.id)
        .order('scheduled_date', { ascending: false })

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false })

      const { data: actionPlans } = await supabase
        .from('action_plans')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false })

      setData({
        client,
        sessions: sessions || [],
        goals: goals || [],
        actionPlans: actionPlans || [],
      })
      setLoading(false)
    }

    loadClientDetails()
  }, [params.id, router])

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  const { client, sessions, goals, actionPlans } = data

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      case 'completed':
        return 'Completado'
      default:
        return status
    }
  }

  const completedSessions = sessions.filter((s: any) => s.status === 'completed')
  const completedGoals = goals.filter((g: any) => g.status === 'completed')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Clientes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={client.profile_image} />
                <AvatarFallback className="text-2xl">{getInitials(client.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{client.name}</h1>
                    <Badge className={getStatusColor(client.status)}>
                      {getStatusLabel(client.status)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Cliente desde {format(parseISO(client.created_at), 'dd MMMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                {completedSessions.length} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                {completedGoals.length} completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Planes de Acción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{actionPlans.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                {actionPlans.filter((ap: any) => ap.status === 'completed').length} completados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" asChild className="h-auto py-4">
            <Link href={`/clients/${client.id}/coaching-plan/new`}>
              <div className="text-center w-full">
                <Target className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Plan de Coaching</div>
                <p className="text-xs text-gray-600 mt-1">Crear plan estructurado</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" asChild className="h-auto py-4">
            <Link href={`/clients/${client.id}/progress`}>
              <div className="text-center w-full">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Progreso y Logros</div>
                <p className="text-xs text-gray-600 mt-1">Ver avances del cliente</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" asChild className="h-auto py-4">
            <Link href={`/sessions/new?clientId=${client.id}`}>
              <div className="text-center w-full">
                <Plus className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Nueva Sesión</div>
                <p className="text-xs text-gray-600 mt-1">Agendar sesión de coaching</p>
              </div>
            </Link>
          </Button>
        </div>

        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sesiones Recientes
            </CardTitle>
            <Link href={`/sessions/new?clientId=${client.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sesión
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No hay sesiones registradas</p>
                <Link href={`/sessions/new?clientId=${client.id}`}>
                  <Button size="sm">Agendar Primera Sesión</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session: any) => (
                  <Link key={session.id} href={`/sessions/${session.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-medium text-slate-900">{session.title}</h4>
                        <p className="text-sm text-slate-600">
                          {format(parseISO(session.scheduled_date), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline">{session.status}</Badge>
                    </div>
                  </Link>
                ))}
                {sessions.length > 5 && (
                  <Link href="/sessions">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas las sesiones
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">No hay objetivos definidos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal: any) => (
                  <div key={goal.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{goal.title}</h4>
                      <Badge variant="outline">{goal.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{goal.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Progreso: {goal.progress}%</span>
                      {goal.target_date && (
                        <span>Meta: {format(parseISO(goal.target_date), 'dd MMM yyyy', { locale: es })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
