/**
 * Helper utilities for message processing without component dependencies
 * This file should NOT import any React components to avoid circular dependencies
 */

import { Message } from 'ai'

/**
 * Safely extract text content from any message object
 */
export function getSafeContent(input: any): string {
  // Handle string content directly
  if (typeof input === 'string') {
    return input
  }

  // Handle null/undefined
  if (input === null || input === undefined) {
    return ''
  }

  // Handle streamable content objects
  if (input && typeof input === 'object' && 'value' in input) {
    return getSafeContent(input.value)
  }

  // Handle arrays with object elements (like tool calls)
  if (Array.isArray(input) && input.length > 0) {
    if (typeof input[0] === 'object' && input[0] !== null) {
      // Try to extract tool info
      const item = input[0]
      if (item.toolName || item.type === 'tool-call') {
        return 'Procesando solicitud...'
      }
      // Join array of strings
      return input.filter(item => typeof item === 'string').join(' ')
    }
  }

  // For objects, try to get meaningful string
  if (typeof input === 'object') {
    // If it has a toString method that's not the default
    if (input.toString && input.toString() !== '[object Object]') {
      return input.toString()
    }

    // Check for common text properties
    if (input.text) return input.text
    if (input.content && typeof input.content === 'string') return input.content

    // Return placeholder for complex objects
    return 'Procesando respuesta...'
  }

  // Convert other primitives to string
  return String(input)
}

/**
 * Generate a descriptive title from message content
 */
export function generateChatTitle(content: any): string {
  // Handle string content
  if (typeof content === 'string') {
    return content.length > 40 ? `${content.substring(0, 40)}...` : content
  }

  // Handle object content with content property
  if (content && typeof content === 'object' && content.content) {
    const innerContent =
      typeof content.content === 'string'
        ? content.content
        : JSON.stringify(content.content)
    return innerContent.length > 40
      ? `${innerContent.substring(0, 40)}...`
      : innerContent
  }

  // Default title
  return 'Nueva conversación'
}
