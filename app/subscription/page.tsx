'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PayPalSubscriptionButton from '@/components/paypal/PayPalSubscriptionButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Plan ID de PayPal - Reemplazar con el real
const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || 'P-XXXXXXXXXXXXXXXXXX'

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        router.push('/register')
        return
      }

      // Si ya tiene suscripción activa, redirigir al dashboard
      if (profile.subscription_status === 'active') {
        router.push('/dashboard')
        return
      }

      setUser(profile)
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2.5 group mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                CoachLatam
              </span>
            </div>
          </Link>

          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ¡Bienvenido, {user?.full_name}!
          </h1>
          <p className="text-lg text-slate-600">
            Completa tu suscripción para acceder a todas las funcionalidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-blue-500 text-white">Plan Profesional</Badge>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">$14.99</div>
                  <div className="text-sm text-slate-500">USD / mes</div>
                </div>
              </div>
              <CardTitle>CoachLatam Pro</CardTitle>
              <CardDescription>
                Todo lo que necesitas para gestionar tu práctica de coaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Clientes Ilimitados</p>
                    <p className="text-sm text-slate-600">Sin límites en tu lista de clientes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Sesiones Ilimitadas</p>
                    <p className="text-sm text-slate-600">Programa y gestiona todas tus sesiones</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Herramientas de Análisis</p>
                    <p className="text-sm text-slate-600">Seguimiento de progreso y patrones</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Perfil en Marketplace</p>
                    <p className="text-sm text-slate-600">Aparece en búsquedas de clientes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Planes de Coaching</p>
                    <p className="text-sm text-slate-600">Crea y gestiona planes personalizados</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Soporte Prioritario</p>
                    <p className="text-sm text-slate-600">Respuesta en menos de 24 horas</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">
                    ✓ Cancela en cualquier momento
                  </p>
                  <p className="text-sm text-slate-600">
                    ✓ Sin compromisos de permanencia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suscribirse con PayPal</CardTitle>
                <CardDescription>
                  Pago seguro procesado por PayPal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayPalSubscriptionButton 
                  userId={user?.id} 
                  planId={PAYPAL_PLAN_ID}
                />

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Al suscribirte, aceptas nuestros{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Términos de Servicio
                    </Link>
                    {' '}y{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Política de Privacidad
                    </Link>
                  </p>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    <span>Pago seguro con cifrado SSL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

<Card className="bg-slate-50">
  <CardContent className="pt-6">
    <h3 className="font-semibold text-slate-900 mb-2">
      ¿Necesitas más información?
    </h3>
    <p className="text-sm text-slate-600 mb-4">
      Si tienes preguntas sobre la suscripción, contáctanos
    </p>
    <a href="mailto:info@athernus.com?subject=Consulta sobre Suscripción - CoachLatam">
      <Button variant="outline" className="w-full">
        Contactar Soporte
      </Button>
    </a>
  </CardContent>
</Card>
          </div>
        </div>
      </div>
    </div>
  )
}
