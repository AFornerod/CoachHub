'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'

interface PayPalSubscriptionButtonProps {
  userId: string
  planId: string // Plan ID de PayPal
}

export default function PayPalSubscriptionButton({ userId, planId }: PayPalSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleApprove = async (data: any) => {
    setIsLoading(true)
    console.log('✅ Subscription approved:', data)

    try {
      // Guardar suscripción en la base de datos
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          paypal_subscription_id: data.subscriptionID,
          paypal_plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString(),
        })

      if (error) {
        console.error('Error saving subscription:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo guardar la suscripción. Contacta soporte.',
        })
        return
      }

      // Actualizar estado del usuario
      await supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('id', userId)

      toast({
        title: '¡Suscripción Activada!',
        description: 'Tu suscripción se ha activado correctamente.',
      })

      // Redirigir al dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error processing subscription:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al procesar tu suscripción.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleError = (err: any) => {
    console.error('PayPal error:', err)
    toast({
      variant: 'destructive',
      title: 'Error de PayPal',
      description: 'Hubo un problema con PayPal. Por favor intenta de nuevo.',
    })
  }

  const handleCancel = () => {
    toast({
      title: 'Suscripción Cancelada',
      description: 'Cancelaste el proceso de suscripción.',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Procesando suscripción...</span>
      </div>
    )
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        vault: true,
        intent: 'subscription',
      }}
    >
      <PayPalButtons
        createSubscription={(data, actions) => {
          return actions.subscription.create({
            plan_id: planId,
          })
        }}
        onApprove={handleApprove}
        onError={handleError}
        onCancel={handleCancel}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'subscribe',
        }}
      />
    </PayPalScriptProvider>
  )
}
