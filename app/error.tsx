'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  // Log errors to console for debugging
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto p-4">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error en la aplicación</AlertTitle>
        <AlertDescription>
          {error.message || 'Ha ocurrido un error inesperado'}
          {error.digest && (
            <div className="text-xs mt-2 opacity-70">
              Error ID: {error.digest}
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refrescar la página
        </Button>

        <Button variant="default" onClick={() => reset()}>
          Intentar de nuevo
        </Button>

        <Button variant="default" onClick={() => router.push('/new')}>
          Iniciar nuevo chat
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-8 max-w-md text-center">
        Si el problema persiste, por favor contacta al soporte o intenta de
        nuevo más tarde.
      </p>
    </div>
  )
}
