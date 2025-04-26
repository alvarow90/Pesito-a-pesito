'use client'

/**
 * Utility functions for safely rendering complex objects in React
 */

import React from 'react'

/**
 * Safely renders a potentially complex object as a string
 * This is useful when dealing with JSON content that might
 * contain nested objects that React can't directly render
 */
export function safeRenderContent(content: any): string {
  // Handle primitive types
  if (content === null || content === undefined) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content)
  }

  // Handle arrays
  if (Array.isArray(content)) {
    return content
      .map(item => safeRenderContent(item))
      .filter(Boolean)
      .join(' ')
  }

  // Handle objects
  if (typeof content === 'object') {
    // Check for common text properties
    if (content.text) return content.text
    if (content.content) return safeRenderContent(content.content)
    if (content.message) return content.message
    if (content.value) return content.value

    // For tool-related content, generate descriptive text
    if (content.toolName) {
      let text = `Using ${content.toolName}`
      if (content.args?.symbol) {
        text += ` for ${content.args.symbol}`
      }
      return text
    }

    try {
      // As a last resort, try JSON.stringify, but catch any circular references
      return JSON.stringify(content)
    } catch (e) {
      return '[Complex Object]'
    }
  }

  // Fallback
  return '[Unknown Content]'
}

/**
 * Checks if a given value can be safely rendered directly by React
 */
export function isDirectlyRenderable(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value)
  )
}

/**
 * Safely extracts text content from potentially complex message objects
 * Useful for displaying simplified versions in the chat sidebar
 */
export function extractMessageText(message: any): string {
  if (!message) return ''

  // For user messages, content is usually a string
  if (message.role === 'user') {
    return safeRenderContent(message.content)
  }

  // For assistant messages, might need deeper processing
  if (message.role === 'assistant') {
    if (Array.isArray(message.content)) {
      // For tool calls, create descriptive text
      const item = message.content[0]
      if (item && item.type === 'tool-call') {
        let text = `Showing ${item.toolName?.replace('show', '')}`.toLowerCase()
        if (item.args?.symbol) {
          text += ` for ${item.args.symbol}`
        }
        return text
      }
    }

    // Default processing
    return safeRenderContent(message.content)
  }

  // For tools, typically don't show in UI
  if (message.role === 'tool') {
    return ''
  }

  // Fallback
  return safeRenderContent(message.content)
}
