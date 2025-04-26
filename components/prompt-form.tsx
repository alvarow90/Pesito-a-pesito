'use client'

import * as React from 'react'
import { useState } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from '@/lib/utils'
import type { AI } from '@/lib/chat/actions'
import { UserMessage } from './stocks/message'
import { toast } from 'sonner'

export interface PromptProps {
  input: string
  setInput: (value: string) => void
  checkMessageLimit?: () => Promise<boolean>
  disabled?: boolean
}

export function PromptForm({
  input,
  setInput,
  checkMessageLimit,
  disabled = false
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [messages, setMessages] = useUIState<typeof AI>()
  const [isLoading, setIsLoading] = useState(false)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Don't submit if disabled or empty input
    if (disabled || !input.trim() || isLoading) {
      return
    }

    setIsLoading(true)

    try {
      if (checkMessageLimit) {
        const canProceed = await checkMessageLimit()
        if (!canProceed) {
          setIsLoading(false)
          return
        }
      }

      const value = input.trim()
      setInput('')

      // Add user message to UI immediately
      const userMessage = {
        id: nanoid(),
        display: <UserMessage>{value}</UserMessage>
      }

      setMessages((currentMessages: any) => [...currentMessages, userMessage])

      // Get AI response
      const responseMessage = await submitUserMessage(value)

      // Add AI response to UI
      setMessages((currentMessages: any) => [
        ...currentMessages,
        responseMessage
      ])
    } catch (error) {
      console.error('Error submitting message:', error)
      toast.error('Error al enviar el mensaje')
    } finally {
      setIsLoading(false)

      // Focus input after completion
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background pr-8 sm:rounded-md sm:border sm:pr-12"
    >
      <Textarea
        ref={inputRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        rows={1}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Envía un mensaje..."
        spellCheck={false}
        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none text-[18px] lg:text-sm"
        disabled={disabled || isLoading}
      />
      <div className="absolute right-0 top-[13px] sm:right-4">
        <Button
          type="submit"
          size="icon"
          disabled={disabled || isLoading || !input.trim()}
        >
          <SendIcon className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
          <span className="sr-only">Enviar mensaje</span>
        </Button>
      </div>
    </form>
  )
}
