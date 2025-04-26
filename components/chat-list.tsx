'use client'

import React from 'react'
import { SpinnerMessage } from './stocks/message'

interface ChatListProps {
  messages: any[]
  isShared?: boolean
  session?: any
}

export function ChatList({ messages, isShared, session }: ChatListProps) {
  if (!messages || !messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => {
        // Skip invalid messages
        if (!message || !message.id) {
          return null
        }

        // Handle different message formats safely
        if (message.display && React.isValidElement(message.display)) {
          // Normal case - valid React element
          return (
            <div key={message.id} className="my-4 md:my-6">
              {message.display}
            </div>
          )
        }

        // For missing display but with id, show a loading spinner
        return (
          <div key={message.id} className="my-4 md:my-6">
            <SpinnerMessage />
          </div>
        )
      })}
    </div>
  )
}
