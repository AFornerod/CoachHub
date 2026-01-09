'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, DollarSign, TrendingUp, Clock, Target, Activity, Bell, Mail, ArrowRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { SessionsChart } from '@/components/dashboard/SessionsChart'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ClientDistributionChart } from '@/components/dashboard/ClientDistributionChart'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardData {
  activeClientsCount: number
  sessionsCompletedThisMonth: number
  sessionsTotalThisMonth: number
  revenueThisMonth: number
  upcomingSessions: any[]
  previousMonthSessions: number
  previousMonthRevenue: number
  inactiveClientsCount: number
  completedClientsCount: number
  sessionsChartData: Array<{ month: string; completed: number; scheduled: number }>
  revenueChartData: Array<{ month: string; revenue: number }>
  avgSessionsPerClient: number
  avgRevenuePerSession: number
  pendingRequests: any[]
  pendingRequestsCount: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
      console.log('Dashboard: Loading dashboard...')
      const supabase = createClient()

      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Dashboard: User check:', { hasUser: !!user, userId: user?.id, error })

      if (!user) {
        console.log('Dashboard: No user found, redirecting to login')
        router.push('/login')
        return
      }

// ============================================
// VERIFICACIÓN DE SUSCRIPCIÓN
// ============================================
console.log('Dashboard: Checking subscription status...')

const { data: subscription, error: subError } = await supabase
  .from('subscriptions')
  .select('status')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle()

if (subError) {
  console.error('Dashboard: Error checking subscription:', subError)
}

if (!subscription) {
  console.log('Dashboard: No active subscription found, redirecting to /subscription')
  router.push('/subscription')
  return
}

console.log('Dashboard: Active subscription found:', subscription.status)

      console.log('Dashboard: User authenticated, loading data...')

      // Obtener coach_profile_id
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)

      const activeClients = clients?.filter(c => c.status === 'active') || []
      const inactiveClients = clients?.filter(c => c.status === 'inactive') || []
      const completedClients = clients?.filter(c => c.status === 'completed') || []

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, clients(full_name)')
        .eq('coach_id', user.id)
        .order('scheduled_date', { ascending: true })

      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const prevMonthStart = startOfMonth(subMonths(now, 1))
      const prevMonthEnd = endOfMonth(subMonths(now, 1))

      const sessionsThisMonth = sessions?.filter(s => {
        const date = parseISO(s.scheduled_date)
        return date >= monthStart && date <= monthEnd
      }) || []

      const sessionsPrevMonth = sessions?.filter(s => {
        const date = parseISO(s.scheduled_date)
        return date >= prevMonthStart && date <= prevMonthEnd
      }) || []

      const completedSessions = sessionsThisMonth.filter(s => s.status === 'completed')
      const upcomingSessions = sessions?.filter(s => {
        const date = parseISO(s.scheduled_date)
        return date > now && s.status === 'scheduled'
      }).slice(0, 5) || []

      const sessionsChartData = []
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i)
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)

        const monthSessions = sessions?.filter(s => {
          const date = parseISO(s.scheduled_date)
          return date >= monthStart && date <= monthEnd
        }) || []

        sessionsChartData.push({
          month: format(month, 'MMM', { locale: es }),
          completed: monthSessions.filter(s => s.status === 'completed').length,
          scheduled: monthSessions.length
        })
      }

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('coach_id', user.id)

      // Si la tabla payments no existe o hay error, usar array vacío
      const paymentsData = paymentsError ? [] : (payments || [])

      const paymentsThisMonth = paymentsData.filter(p => {
        const date = parseISO(p.created_at)
        return isSameMonth(date, now)
      })

      const paymentsPrevMonth = paymentsData.filter(p => {
        const date = parseISO(p.created_at)
        return date >= prevMonthStart && date <= prevMonthEnd
      })

      const revenueThisMonth = paymentsThisMonth
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      const revenuePrevMonth = paymentsPrevMonth
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      const revenueChartData = []
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i)
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)

        const monthPayments = paymentsData.filter(p => {
          const date = parseISO(p.created_at)
          return date >= monthStart && date <= monthEnd && p.status === 'paid'
        })

        revenueChartData.push({
          month: format(month, 'MMM', { locale: es }),
          revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        })
      }

      const totalSessions = sessions?.length || 0
      const totalCompletedSessions = sessions?.filter(s => s.status === 'completed').length || 0
      const avgSessionsPerClient = activeClients.length > 0
        ? Math.round(totalSessions / activeClients.length * 10) / 10
        : 0

      const totalRevenue = paymentsData.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      const avgRevenuePerSession = totalCompletedSessions > 0
        ? Math.round(totalRevenue / totalCompletedSessions)
        : 0

      // 🆕 Obtener solicitudes de coaching pendientes
      let pendingRequests: any[] = []
      let pendingRequestsCount = 0

      if (profile) {
        const { data: requests } = await supabase
          .from('coaching_requests')
          .select('*')
          .eq('coach_profile_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3)

        pendingRequests = requests || []
        pendingRequestsCount = requests?.length || 0
      }

      setData({
        activeClientsCount: activeClients.length,
        sessionsCompletedThisMonth: completedSessions.length,
        sessionsTotalThisMonth: sessionsThisMonth.length,
        revenueThisMonth,
        upcomingSessions,
        previousMonthSessions: sessionsPrevMonth.filter(s => s.status === 'completed').length,
        previousMonthRevenue: revenuePrevMonth,
        inactiveClientsCount: inactiveClients.length,
        completedClientsCount: completedClients.length,
        sessionsChartData,
        revenueChartData,
        avgSessionsPerClient,
        avgRevenuePerSession,
        pendingRequests,
        pendingRequestsCount,
      })
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  const sessionsTrend = data.previousMonthSessions > 0
    ? Math.round(((data.sessionsCompletedThisMonth - data.previousMonthSessions) / data.previousMonthSessions) * 100)
    : 0

  const revenueTrend = data.previousMonthRevenue > 0
    ? Math.round(((data.revenueThisMonth - data.previousMonthRevenue) / data.previousMonthRevenue) * 100)
    : 0

  const clientDistributionData = [
    { name: 'Activos', value: data.activeClientsCount },
    { name: 'Inactivos', value: data.inactiveClientsCount },
    { name: 'Completados', value: data.completedClientsCount },
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Bienvenido a tu panel de control</p>
        </div>

        {/* 🆕 Alerta de solicitudes pendientes */}
        {data.pendingRequestsCount > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Bell className="h-6 w-6 text-yellow-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Tienes {data.pendingRequestsCount} solicitud{data.pendingRequestsCount > 1 ? 'es' : ''} de coaching pendiente{data.pendingRequestsCount > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Revisa y responde a tus potenciales clientes
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/coaching-requests">
                  <Button>
                    Ver Solicitudes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Clientes Activos"
            value={data.activeClientsCount}
            icon={Users}
            description="Total de clientes en proceso"
          />

          <MetricsCard
            title="Sesiones del Mes"
            value={`${data.sessionsCompletedThisMonth}/${data.sessionsTotalThisMonth}`}
            icon={Calendar}
            trend={{
              value: sessionsTrend,
              label: 'vs mes anterior'
            }}
            description="Completadas/Programadas"
          />

          <MetricsCard
            title="Ingresos del Mes"
            value={`$${data.revenueThisMonth.toLocaleString()}`}
            icon={DollarSign}
            trend={{
              value: revenueTrend,
              label: 'vs mes anterior'
            }}
          />

          <MetricsCard
            title="Promedio Sesiones/Cliente"
            value={data.avgSessionsPerClient}
            icon={Activity}
            description="Por cliente activo"
          />

          <MetricsCard
            title="Ingreso Promedio"
            value={`$${data.avgRevenuePerSession.toLocaleString()}`}
            icon={Target}
            description="Por sesión completada"
          />

          <MetricsCard
            title="Tasa de Retención"
            value={data.activeClientsCount > 0 ? '95%' : '0%'}
            icon={TrendingUp}
            description="Últimos 3 meses"
          />

          <MetricsCard
            title="Próximas Sesiones"
            value={data.upcomingSessions.length}
            icon={Clock}
            description="Esta semana"
          />

          {/* 🆕 Card de solicitudes pendientes */}
          <Link href="/dashboard/coaching-requests" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg relative">
                    <Mail className="h-6 w-6 text-blue-600" />
                    {data.pendingRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {data.pendingRequestsCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.pendingRequestsCount}</p>
                    <p className="text-sm text-slate-600">Solicitudes Nuevas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SessionsChart data={data.sessionsChartData} />
          <RevenueChart data={data.revenueChartData} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 🆕 Solicitudes de Coaching Card */}
          {data.pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Solicitudes Recientes
                  </CardTitle>
                  <Badge variant="destructive">{data.pendingRequestsCount} nuevas</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.pendingRequests.map((request: any) => (
                    <Link 
                      key={request.id}
                      href="/dashboard/coaching-requests"
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                              {getInitials(request.client_name || 'C')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{request.client_name}</p>
                            <p className="text-sm text-slate-600">{request.coaching_area}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {format(new Date(request.created_at), "d MMM", { locale: es })}
                          </p>
                          <Badge variant="outline" className="mt-1">Pendiente</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/coaching-requests">
                      Ver Todas las Solicitudes
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ClientDistributionChart data={clientDistributionData} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximas Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-4">No tienes sesiones programadas</p>
                  <Button asChild>
                    <Link href="/sessions/new">Agendar Sesión</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingSessions.map((session: any) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{session.title}</h3>
                          <p className="text-sm text-slate-600">{session.clients?.full_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {format(parseISO(session.scheduled_date), 'dd MMM', { locale: es })}
                          </p>
                          <p className="text-sm text-slate-600">
                            {format(parseISO(session.scheduled_date), 'HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {session.session_type}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sessions">Ver Todas las Sesiones</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
