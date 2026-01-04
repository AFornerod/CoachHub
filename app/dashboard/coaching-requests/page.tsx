'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  MessageSquare,
  Target,
  User,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface CoachingRequest {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  coaching_area: string
  message: string
  preferred_schedule: string
  budget_range: string
  status: 'pending' | 'accepted' | 'rejected'
  coach_response: string | null
  responded_at: string | null
  created_at: string
}

export default function CoachingRequestsPage() {
  const [requests, setRequests] = useState<CoachingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CoachingRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Obtener el coach_profile_id del usuario
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        console.error('No coach profile found')
        setLoading(false)
        return
      }

      // Obtener todas las solicitudes para este coach
      const { data, error } = await supabase
        .from('coaching_requests')
        .select('*')
        .eq('coach_profile_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading requests:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar las solicitudes',
        })
      } else {
        setRequests(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openResponseDialog = (request: CoachingRequest) => {
    setSelectedRequest(request)
    setResponse('')
    setIsDialogOpen(true)
  }

  const handleResponse = async (action: 'accepted' | 'rejected') => {
    if (!selectedRequest || !response.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor escribe una respuesta',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('coaching_requests')
        .update({
          status: action,
          coach_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast({
        title: action === 'accepted' ? '¡Solicitud Aceptada!' : 'Solicitud Rechazada',
        description: `Se ha enviado tu respuesta a ${selectedRequest.client_name}`,
      })

      setIsDialogOpen(false)
      loadRequests()

      // TODO: Aquí podrías agregar lógica para enviar un email al cliente
      
    } catch (error) {
      console.error('Error responding:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar la respuesta',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendiente', variant: 'default' as const, icon: Clock },
      accepted: { label: 'Aceptada', variant: 'default' as const, icon: CheckCircle2 },
      rejected: { label: 'Rechazada', variant: 'destructive' as const, icon: XCircle },
    }
    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.pending
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const RequestCard = ({ request }: { request: CoachingRequest }) => {
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(request.client_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{request.client_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">{request.client_email}</span>
            </div>
            {request.client_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">{request.client_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">{request.coaching_area}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">{request.budget_range}</span>
            </div>
          </div>

          {request.preferred_schedule && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-1">Horario Preferido:</p>
              <p className="text-sm text-slate-600">{request.preferred_schedule}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-1">Mensaje:</p>
            <p className="text-sm text-slate-600">{request.message}</p>
          </div>

          {request.coach_response && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-1">Tu Respuesta:</p>
              <p className="text-sm text-slate-600">{request.coach_response}</p>
              <p className="text-xs text-slate-500 mt-2">
                Respondido el {format(new Date(request.responded_at!), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => openResponseDialog(request)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aceptar
              </Button>
              <Button 
                onClick={() => openResponseDialog(request)}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const acceptedRequests = requests.filter(r => r.status === 'accepted')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Cargando solicitudes...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Solicitudes de Coaching</h1>
          <p className="text-slate-600 mt-1">Gestiona las solicitudes de tus potenciales clientes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-slate-600">Pendientes</p>
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
                  <p className="text-2xl font-bold">{acceptedRequests.length}</p>
                  <p className="text-sm text-slate-600">Aceptadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedRequests.length}</p>
                  <p className="text-sm text-slate-600">Rechazadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              Pendientes
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No hay solicitudes pendientes
                    </h3>
                    <p className="text-slate-600">
                      Las nuevas solicitudes aparecerán aquí
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No hay solicitudes aceptadas</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {acceptedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No hay solicitudes rechazadas</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {rejectedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No has recibido solicitudes aún</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {requests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Responder a {selectedRequest?.client_name}</DialogTitle>
            <DialogDescription>
              Escribe tu respuesta para {selectedRequest?.client_name}. Ellos recibirán un email con tu mensaje.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response">Tu Respuesta *</Label>
              <Textarea
                id="response"
                placeholder="Escribe aquí tu respuesta al cliente..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Sé profesional y cordial en tu respuesta
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResponse('rejected')}
              disabled={isSubmitting || !response.trim()}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleResponse('accepted')}
              disabled={isSubmitting || !response.trim()}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
