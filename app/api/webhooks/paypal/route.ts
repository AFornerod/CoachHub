import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Cliente Supabase con service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar webhook de PayPal
function verifyPayPalWebhook(
  headers: Headers,
  body: string,
  webhookId: string
): boolean {
  // Implementar verificación de firma de PayPal
  // Por ahora, retornar true para desarrollo
  // En producción, verificar la firma usando el SDK de PayPal
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)

    console.log('📨 PayPal Webhook Event:', event.event_type)

    // Verificar webhook (IMPORTANTE en producción)
    const isValid = verifyPayPalWebhook(
      request.headers,
      body,
      process.env.PAYPAL_WEBHOOK_ID!
    )

    if (!isValid) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const subscriptionId = event.resource?.id

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        // Suscripción creada
        console.log('✅ Subscription created:', subscriptionId)
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)
        break

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Suscripción activada (primer pago exitoso)
        console.log('✅ Subscription activated:', subscriptionId)
        
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single()

        if (subscription) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              start_date: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', subscriptionId)

          await supabase
            .from('users')
            .update({ subscription_status: 'active' })
            .eq('id', subscription.user_id)
        }
        break

      case 'BILLING.SUBSCRIPTION.UPDATED':
        // Suscripción actualizada
        console.log('📝 Subscription updated:', subscriptionId)
        break

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Suscripción cancelada por el usuario
        console.log('❌ Subscription cancelled:', subscriptionId)
        
        const { data: cancelledSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single()

        if (cancelledSub) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', subscriptionId)

          await supabase
            .from('users')
            .update({ subscription_status: 'cancelled' })
            .eq('id', cancelledSub.user_id)
        }
        break

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Suscripción suspendida (falta de pago)
        console.log('⚠️ Subscription suspended:', subscriptionId)
        
        const { data: suspendedSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single()

        if (suspendedSub) {
          await supabase
            .from('subscriptions')
            .update({ status: 'suspended' })
            .eq('paypal_subscription_id', subscriptionId)

          await supabase
            .from('users')
            .update({ subscription_status: 'suspended' })
            .eq('id', suspendedSub.user_id)
        }
        break

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Suscripción expirada
        console.log('⏰ Subscription expired:', subscriptionId)
        
        const { data: expiredSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paypal_subscription_id', subscriptionId)
          .single()

        if (expiredSub) {
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('paypal_subscription_id', subscriptionId)

          await supabase
            .from('users')
            .update({ subscription_status: 'expired' })
            .eq('id', expiredSub.user_id)
        }
        break

      case 'PAYMENT.SALE.COMPLETED':
        // Pago completado
        console.log('💰 Payment completed for subscription:', subscriptionId)
        
        // Actualizar next_billing_date
        const nextBillingDate = new Date()
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        
        await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)
        break

      default:
        console.log('ℹ️ Unhandled event type:', event.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
