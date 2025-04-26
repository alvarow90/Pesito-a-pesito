'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { FooterText } from '@/components/footer'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { nanoid } from 'nanoid'
import { UserMessage } from './stocks/message'

export interface ChatPanelProps {
  id?: string
  input: string
  setInput: (input: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
  checkMessageLimit: () => Promise<boolean>
  disabled?: boolean // To disable input during transitions
}

export function ChatPanel({
  id,
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  checkMessageLimit,
  disabled = false
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  const exampleMessages = [
    {
      heading: '¿Cuánto cuesta',
      subheading: 'Apple ahora?',
      message: '¿Cuál es el precio actual de las acciones de Apple?'
    },
    {
      heading: 'Muéstrame una gráfica',
      subheading: 'de $GOOGL',
      message: '¿Puedes mostrarme una gráfica de las acciones de $GOOGL?'
    },
    {
      heading: '¿Qué ha pasado',
      subheading: 'con Amazon últimamente?',
      message: '¿Cuáles son los eventos recientes relacionados con Amazon?'
    },
    {
      heading: '¿Cómo están las finanzas',
      subheading: 'más recientes de Microsoft?',
      message: '¿Cuáles son los últimos resultados financieros de Microsoft?'
    },
    {
      heading: '¿Cómo se está moviendo',
      subheading: 'el mercado por sector hoy?',
      message: '¿Cómo está el desempeño del mercado hoy por sector?'
    },
    {
      heading: 'Muéstrame un buscador',
      subheading: 'para encontrar nuevas acciones',
      message: 'Quiero un screener para descubrir nuevas acciones'
    },
    {
      heading: '¿Cómo va el peso mexicano',
      subheading: 'frente al dólar?',
      message:
        '¿Cuál es el tipo de cambio actual del peso mexicano frente al dólar?'
    },
    {
      heading: '¿Y el euro?',
      subheading: '¿Cómo se compara con el peso?',
      message:
        '¿Cuál es la tasa de cambio actual entre el euro y el peso mexicano?'
    },
    {
      heading: 'Quiero saber el estado',
      subheading: 'de algunas divisas',
      message:
        '¿Me puedes dar un resumen de cómo están el dólar, euro y otras monedas hoy?'
    },
    {
      heading: '¿Cuánto cuesta',
      subheading: 'Bitcoin ahora?',
      message: '¿Cuál es el precio actual de Bitcoin?'
    }
  ]

  interface ExampleMessage {
    heading: string
    subheading: string
    message: string
  }

  const [randExamples, setRandExamples] = useState<ExampleMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const shuffledExamples = [...exampleMessages].sort(
      () => 0.5 - Math.random()
    )
    setRandExamples(shuffledExamples)
  }, [])

  const handleExampleClick = async (message: string) => {
    // If panel is disabled or a request is loading, don't process the click
    if (disabled || isLoading) return

    // Check message limit for free users if the function is provided
    if (checkMessageLimit) {
      const canProceed = await checkMessageLimit()
      if (!canProceed) return
    }

    setIsLoading(true)

    setMessages((currentMessages: any) => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage>{message}</UserMessage>
      }
    ])

    try {
      const responseMessage = await submitUserMessage(message)
      setMessages((currentMessages: any) => [
        ...currentMessages,
        responseMessage
      ])
    } catch (error) {
      console.error('Error submitting example message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            randExamples.map((example, index) => (
              <div
                key={example.heading}
                className={`
                    cursor-pointer border bg-white p-4 
                    hover:bg-zinc-50 transition duration-300 ease-in-out
                    ${index >= 4 ? 'hidden md:block' : ''}
                    ${index >= 2 ? 'hidden 2xl:block' : ''}
                    ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                onClick={() => handleExampleClick(example.message)}
              >
                <div className="text-sm font-semibold">{example.heading}</div>
                <div className="text-sm text-zinc-600">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:border md:py-4">
          <PromptForm
            input={input}
            setInput={setInput}
            checkMessageLimit={checkMessageLimit}
            disabled={disabled || isLoading}
          />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
