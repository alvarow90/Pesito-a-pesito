import React from 'react'
import { Message } from '@/lib/types'
import {
  BotCard,
  BotMessage,
  SpinnerMessage,
  UserMessage
} from '@/components/stocks/message'
import { StockChart } from '@/components/tradingview/stock-chart'
import { StockPrice } from '@/components/tradingview/stock-price'
import { StockFinancials } from '@/components/tradingview/stock-financials'
import { StockNews } from '@/components/tradingview/stock-news'
import { StockScreener } from '@/components/tradingview/stock-screener'
import { MarketOverview } from '@/components/tradingview/market-overview'
import { MarketHeatmap } from '@/components/tradingview/market-heatmap'
import { MarketTrending } from '@/components/tradingview/market-trending'
import { ETFHeatmap } from '@/components/tradingview/etf-heatmap'

/**
 * Helper function to safely extract text from complex message content
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
 * Creates appropriate UI components for different message types
 * This is used by server components, so it can't use React hooks
 */
export function createMessageDisplay(message: Message): React.ReactNode {
  // Handle user messages
  if (message.role === 'user') {
    // Convert content to string if needed
    const content =
      typeof message.content === 'string'
        ? message.content
        : getSafeContent(message.content)

    return <UserMessage>{content}</UserMessage>
  }

  // Handle assistant messages with tool calls
  if (message.role === 'assistant' && Array.isArray(message.content)) {
    const toolCall = message.content[0]
    if (toolCall && toolCall.type === 'tool-call') {
      // Process tool calls into appropriate components
      const { toolName, args } = toolCall as any

      switch (toolName) {
        case 'showStockChart':
          return (
            <BotCard>
              <StockChart
                symbol={args?.symbol || ''}
                comparisonSymbols={args?.comparisonSymbols || []}
              />
            </BotCard>
          )
        case 'showStockPrice':
          return (
            <BotCard>
              <StockPrice props={args?.symbol || ''} />
            </BotCard>
          )
        case 'showStockFinancials':
          return (
            <BotCard>
              <StockFinancials props={args?.symbol || ''} />
            </BotCard>
          )
        case 'showStockNews':
          return (
            <BotCard>
              <StockNews props={args?.symbol || ''} />
            </BotCard>
          )
        case 'showStockScreener':
          return (
            <BotCard>
              <StockScreener />
            </BotCard>
          )
        case 'showMarketOverview':
          return (
            <BotCard>
              <MarketOverview />
            </BotCard>
          )
        case 'showMarketHeatmap':
          return (
            <BotCard>
              <MarketHeatmap />
            </BotCard>
          )
        case 'showTrendingStocks':
          return (
            <BotCard>
              <MarketTrending />
            </BotCard>
          )
        case 'showETFHeatmap':
          return (
            <BotCard>
              <ETFHeatmap />
            </BotCard>
          )
        default:
          // Fallback for unknown tools
          return <SpinnerMessage />
      }
    }
  }

  // Handle plain text assistant messages
  if (message.role === 'assistant') {
    // Convert content to safe text
    const safeContent =
      typeof message.content === 'string'
        ? message.content
        : getSafeContent(message.content)

    return <BotMessage content={safeContent} />
  }

  // Tool messages are typically not displayed directly
  if (message.role === 'tool') {
    return null
  }

  // Fallback
  return <SpinnerMessage />
}

/**
 * Generate a descriptive title from message content
 */
export function generateChatTitle(message: Message): string {
  if (!message) return 'Nueva conversación'

  if (message.role !== 'user') return 'Nueva conversación'

  const content =
    typeof message.content === 'string'
      ? message.content
      : getSafeContent(message.content)

  if (!content) return 'Nueva conversación'

  return content.length > 50 ? `${content.substring(0, 50)}...` : content
}
