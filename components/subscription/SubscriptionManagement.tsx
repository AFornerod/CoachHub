'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, Calendar, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error loading subscription:', error)
        return
      }

      setSubscription(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancelSubscription() {
    setIsCancelling(true)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'User requested cancellation',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel')
      }

      toast({
        title: 'Suscripción Cancelada',
        description: 'Tu suscripción se ha cancelado correctamente.',
      })

      // Recargar datos
      await loadSubscription()
    } catch (error: any) {
      console.error('Error cancelling:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo cancelar la suscripción',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Activa' },
      cancelled: { variant: 'secondary', label: 'Cancelada' },
      suspended: { variant: 'destructive', label: 'Suspendida' },
      expired: { variant: 'outline', label: 'Expirada' },
      pending: { variant: 'outline', label: 'Pendiente' },
    }

    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>No tienes una suscripción activa</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Necesitas una suscripción activa para acceder a todas las funcionalidades.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => window.location.href = '/subscription'}>
            Ver Planes
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suscripción</CardTitle>
            <CardDescription>Gestiona tu suscripción de CoachLatam Pro</CardDescription>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Plan</p>
              <p className="font-medium">{subscription.plan_name}</p>
              <p className="text-sm text-slate-600">
                ${subscription.plan_price} {subscription.currency} / mes
              </p>
            </div>
          </div>

          {subscription.next_billing_date && subscription.status === 'active' && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Próxima Facturación</p>
                <p className="font-medium">
                  {format(new Date(subscription.next_billing_date), 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {subscription.status === 'active' && (
          <Alert>
            <AlertDescription>
              Tu suscripción está activa. El próximo cobro se realizará automáticamente.
            </AlertDescription>
          </Alert>
        )}

        {subscription.status === 'cancelled' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tu suscripción fue cancelada el{' '}
              {format(new Date(subscription.cancelled_at), 'dd MMMM yyyy', { locale: es })}.
              Puedes reactivarla en cualquier momento.
            </AlertDescription>
          </Alert>
        )}

        {subscription.status === 'suspended' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tu suscripción está suspendida por falta de pago. Por favor actualiza tu método de pago.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {subscription.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isCancelling}>
                  Cancelar Suscripción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar Suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Al cancelar tu suscripción:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Perderás acceso a todas las funcionalidades Pro</li>
                      <li>No se te cobrará en el próximo ciclo</li>
                      <li>Puedes reactivarla en cualquier momento</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, mantener suscripción</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Sí, cancelar'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
            <Button onClick={() => window.location.href = '/subscription'}>
              Reactivar Suscripción
            </Button>
          )}

          {subscription.status === 'suspended' && (
            <Button onClick={() => window.open(subscription.paypal_subscription_id, '_blank')}>
              Actualizar Método de Pago
            </Button>
          )}
        </div>

        {/* PayPal Link */}
        <div className="text-sm text-slate-500 pt-4 border-t">
          <p>
            Gestiona tu suscripción directamente en{' '}
            <a
              href="https://www.paypal.com/myaccount/autopay/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              PayPal
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
