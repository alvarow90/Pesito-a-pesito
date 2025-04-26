'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DefiPayment } from '@/components/subscription/defi-payment'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/store/user-store'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

export default function PricingPage() {
  const [showPayment, setShowPayment] = useState(false)
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const { user, fetchUser, subscription, fetchSubscription } = useUserStore()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchUser()
      fetchSubscription()
    }
  }, [isLoaded, isSignedIn, fetchUser, fetchSubscription])

  const handleSubscribe = () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    setShowPayment(true)
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Suscripción cancelada correctamente')
        fetchUser()
        fetchSubscription()
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error('Ocurrió un error al cancelar la suscripción')
    }
  }

  const isSubscribed = user?.subscriptionStatus === 'premium'

  return (
    <div className="flex justify-center py-10">
      <div className="max-w-5xl w-full px-4 space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Planes de Suscripción</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="border rounded-lg p-6 flex flex-col">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Plan Gratuito</h2>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-muted-foreground">
                Perfecto para probar nuestra plataforma
              </p>
            </div>

            <div className="mt-6 space-y-4 flex-1">
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Acceso a la IA financiera básica</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Límite de 3 mensajes por conversación</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Sin almacenamiento de historial</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Gráficos de mercado en tiempo real</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/')}
              >
                {isSubscribed
                  ? 'Continuar con el plan gratuito'
                  : 'Comenzar gratis'}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="border rounded-lg p-6 flex flex-col relative overflow-hidden">
            <div className="absolute -right-12 top-6 rotate-45">
              <Badge className="px-4 py-1">Popular</Badge>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Plan Premium</h2>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">0.01 ETH</span>
                <span className="text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-muted-foreground">
                Para usuarios que necesitan análisis financiero avanzado
              </p>
            </div>

            <div className="mt-6 space-y-4 flex-1">
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Acceso completo a la IA financiera</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Mensajes ilimitados</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Historial de conversaciones guardado</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Gráficos de mercado en tiempo real</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Prioridad en las respuestas</span>
              </div>
            </div>

            <div className="mt-6">
              {isSubscribed ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelSubscription}
                >
                  Cancelar suscripción
                </Button>
              ) : showPayment ? (
                <DefiPayment />
              ) : (
                <Button className="w-full" onClick={handleSubscribe}>
                  Suscribirse
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Todos los planes incluyen actualizaciones gratuitas y soporte
            técnico
          </p>
          <p>Para cualquier consulta, contáctanos en support@pesitoapes.ito</p>
        </div>
      </div>
    </div>
  )
}
