'use client'

import { useUser } from '@clerk/nextjs'
import Typewriter from 'typewriter-effect'
import { useMemo } from 'react'

export function EmptyScreen() {
  const { user, isSignedIn, isLoaded } = useUser()

  const greetings = [
    '¡Hola! Bienvenido a Pesito a Pesito.',
    '¡Qué bueno verte en Pesito a Pesito!',
    '¡Bienvenido de nuevo a Pesito a Pesito!',
    '¡Listo para empezar en Pesito a Pesito?',
    '¡Vamos a ahorrar juntos en Pesito a Pesito!',
    '¡Un paso más hacia tus metas con Pesito a Pesito!'
  ]

  const greeting = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * greetings.length)
    const base = greetings[randomIndex]
    return isSignedIn && user ? `${base} ${user.firstName}!` : base
  }, [isSignedIn, user])

  // Esperamos hasta que Clerk haya cargado
  if (!isLoaded) {
    return null // o puedes renderizar un loader, es opcional
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 p-8">
        <h1 className="text-xl font-semibold tracking-tighter text-center">
          <Typewriter
            onInit={typewriter => {
              typewriter
                .typeString(greeting)
                .callFunction(() => {
                  const cursor = document.querySelector('.Typewriter__cursor')
                  if (cursor) (cursor as HTMLElement).style.display = 'none'
                })
                .start()
            }}
            options={{
              delay: 40,
              loop: false
            }}
          />
        </h1>
      </div>
    </div>
  )
}
