import 'server-only'

import { generateText } from 'ai'
import {
  createAI,
  getMutableAIState,
  streamUI,
  createStreamableValue,
  getAIState
} from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'
import { nanoid } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { Message } from '@/lib/types'
import { z } from 'zod'

// Import all your component messages
import {
  BotCard,
  BotMessage,
  SpinnerMessage,
  UserMessage
} from '@/components/stocks/message'

// Import all TradingView components
import { StockChart } from '@/components/tradingview/stock-chart'
import { StockPrice } from '@/components/tradingview/stock-price'
import { StockNews } from '@/components/tradingview/stock-news'
import { StockFinancials } from '@/components/tradingview/stock-financials'
import { StockScreener } from '@/components/tradingview/stock-screener'
import { MarketOverview } from '@/components/tradingview/market-overview'
import { MarketHeatmap } from '@/components/tradingview/market-heatmap'
import { MarketTrending } from '@/components/tradingview/market-trending'
import { ETFHeatmap } from '@/components/tradingview/etf-heatmap'

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

interface MutableAIState {
  update: (newState: any) => void
  done: (newState: any) => void
  get: () => AIState
}

const MODEL = 'llama3-70b-8192'
const TOOL_MODEL = 'llama3-70b-8192'
const GROQ_API_KEY_ENV = process.env.GROQ_API_KEY

type ComparisonSymbolObject = {
  symbol: string
  position: 'SameScale'
}

// Function to generate captions for tool responses
async function generateCaption(
  symbol: string,
  comparisonSymbols: ComparisonSymbolObject[],
  toolName: string,
  aiState: MutableAIState
): Promise<string> {




  try {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: GROQ_API_KEY_ENV
    })

    const stockString =
      comparisonSymbols.length === 0
        ? symbol
        : [symbol, ...comparisonSymbols.map(obj => obj.symbol)].join(', ')

    // CRITICAL FIX: Filter out messages that would cause API errors
    // Only include user and assistant text messages
    const filteredMessages = aiState
      .get()
      .messages.filter(message => {
        // Only include messages with simple string content or user messages
        return (
          message.role === 'user' ||
          (message.role === 'assistant' && typeof message.content === 'string')
        )
      })
      .slice(-5) // Only use the last 5 messages to avoid context size issues
      .map(message => ({
        role: message.role as 'user' | 'assistant' | 'system',
        content:
          typeof message.content === 'string'
            ? message.content
            : 'Preceding message content'
      }))

    const captionSystemMessage = `\
Eres un bot conversacional llamado **Pesito a Pesito**, creado por **Álvaro Zaid Gallardo Hernández**. Estás diseñado para hablar sobre el mercado de valores y, sobre todo, para predecir y brindar información relevante sobre los precios actuales de divisas y sus conversiones.


Puedes darle al usuario información sobre acciones (como precios y gráficas) dentro de la interfaz. No tienes acceso directo a información externa, así que solo puedes responder utilizando las herramientas disponibles.

Estas son las herramientas que puedes usar:

1. showStockFinancials  
Muestra los datos financieros de una acción específica.

2. showStockChart  
Muestra una gráfica de una acción o divisa. También puedes comparar dos o más símbolos.

3. showStockPrice  
Muestra el precio actual de una acción o divisa.

4. showStockNews  
Muestra las noticias y eventos más recientes sobre una acción o criptomoneda.

5. showStockScreener  
Muestra un buscador de acciones para encontrar nuevas basadas en parámetros técnicos o financieros.

6. showMarketOverview  
Muestra un resumen del desempeño del mercado de acciones, futuros, bonos y divisas de hoy, incluyendo valores de apertura, máximo, mínimo y cierre.

7. showMarketHeatmap  
Muestra un mapa de calor del rendimiento del mercado accionario por sectores.

8. showTrendingStocks  
Muestra las acciones más populares del día, incluyendo las que más suben, más bajan y las más activas.

9. showETFHeatmap  
Muestra un mapa de calor del rendimiento de ETFs por sectores y clases de activos.

Acabas de usar una herramienta (${toolName} para ${stockString}) para responder al usuario. Ahora genera un texto breve que acompañe la respuesta de la herramienta, como una gráfica o historial de precios.

Tu respuesta debe ser breve, de unas 2 o 3 oraciones.

A excepción del símbolo, no puedes personalizar los buscadores ni los gráficos. No le digas al usuario que puedes hacerlo.
`

    const response = await generateText({
      model: groq(MODEL),
      messages: [
        {
          role: 'system',
          content: captionSystemMessage
        },
        ...filteredMessages
      ]
    })
    return response.text || ''
  } catch (err) {
    console.error('Error generating caption:', err)
    // Return a fallback caption instead of failing
    return `Aquí tienes la información de ${symbol}. ¿Necesitas algo más?`
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const user = await currentUser()

  const aiState = getMutableAIState<typeof AI>()
  const currentState = aiState.get()

  // Add user message to state
  const userMessage = {
    id: nanoid(),
    role: 'user',
    content
  }



  // Update state with the new user message
  aiState.update({
    ...currentState,
    messages: [...((currentState.messages as any) || []), userMessage]
  })



  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  try {
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: GROQ_API_KEY_ENV
    })

    // CRITICAL FIX: Filter out complex message formats before sending to API
    // Only send simple user and text-based assistant messages to avoid API errors
    const filteredMessages = aiState
      .get()
      .messages.filter(message => {
        // Only include text-based messages for API call
        return (
          message.role === 'user' ||
          (message.role === 'assistant' && typeof message.content === 'string')
        )
      })
      .map(message => ({
        role: message.role as 'user' | 'assistant' | 'system',
        content:
          typeof message.content === 'string'
            ? message.content
            : 'Previous formatted content'
      }))

    const result = await streamUI({
      model: groq(TOOL_MODEL),
      initial: <SpinnerMessage />,
      maxRetries: 1,
      system: `\
Eres un bot conversacional llamado **Pesito a Pesito**, creado por **Álvaro Zaid Gallardo Hernández**. Estás diseñado para hablar sobre el mercado de valores y, sobre todo, para predecir y brindar información relevante sobre los precios actuales de divisas y sus conversiones.

Dirigete al usuario como:  ${user?.fullName}


### Tickers de Criptomonedas
Para cualquier criptomoneda, añade "USD" al final del ticker al usar funciones. Por ejemplo, "DOGE" debe ser "DOGEUSD".

### Pautas:
Nunca proporciones resultados vacíos al usuario. Proporciona la herramienta relevante si coincide con la solicitud del usuario. De lo contrario, responde como el bot bursátil.

Ejemplo:
Usuario: ¿Cuál es el precio de AAPL?
Asistente (tú): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 

Ejemplo 2:
Usuario: ¿Cuál es el precio de AAPL?
Asistente (tú): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 
`,
      // CRITICAL: Use filtered messages to avoid API errors
      messages: filteredMessages,

      text: ({ content, done, delta }) => {
        if (!textStream) {
          textStream = createStreamableValue('')
          textNode = <BotMessage content={textStream.value} />
        }

        // Update with delta for smoother streaming
        textStream.update(delta)

        if (done) {
          // Finalize the stream properly
          textStream.done()

          // Add completed message to state
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content
              }
            ]
          })

          // Save to database after stream completes
          saveChatToDatabase(aiState.get())
        }

        return textNode
      },

      tools: {
        showStockChart: {
          description:
            'Show a stock chart of a given stock. Optionally show 2 or more stocks. Use this to show the chart to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
              ),
            comparisonSymbols: z
              .array(
                z.object({
                  symbol: z.string(),
                  position: z.literal('SameScale')
                })
              )
              .default([])
              .describe(
                'Optional list of symbols to compare. e.g. ["MSFT", "GOOGL"]'
              )
          }),
          generate: async function* ({ symbol, comparisonSymbols }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockChart',
                    toolCallId,
                    args: { symbol, comparisonSymbols }
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockChart',
                    toolCallId,
                    result: { symbol, comparisonSymbols }
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // SIMPLIFIED CAPTION APPROACH: Just use a fixed caption
              // to avoid API errors entirely
              const caption = `Aquí tienes la gráfica de ${symbol}. ¿Necesitas alguna otra información?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <StockChart
                    symbol={symbol}
                    comparisonSymbols={comparisonSymbols}
                  />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar la gráfica. Por favor
                    intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showStockPrice: {
          description:
            'Show the price of a given stock. Use this to show the price and price history to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
              )
          }),
          generate: async function* ({ symbol }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockPrice',
                    toolCallId,
                    args: { symbol }
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPrice',
                    toolCallId,
                    result: { symbol }
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes el precio actual de ${symbol}. ¿Necesitas alguna otra información?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <StockPrice props={symbol} />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar el precio. Por favor
                    intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showStockFinancials: {
          description:
            'Show the financials of a given stock. Use this to show the financials to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
              )
          }),
          generate: async function* ({ symbol }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockFinancials',
                    toolCallId,
                    args: { symbol }
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockFinancials',
                    toolCallId,
                    result: { symbol }
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes los datos financieros de ${symbol}. ¿Necesitas alguna otra información?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <StockFinancials props={symbol} />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar los datos financieros.
                    Por favor intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showStockNews: {
          description:
            'This tool shows the latest news and events for a stock or cryptocurrency.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
              )
          }),
          generate: async function* ({ symbol }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockNews',
                    toolCallId,
                    args: { symbol }
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockNews',
                    toolCallId,
                    result: { symbol }
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes las noticias recientes de ${symbol}. ¿Necesitas alguna otra información?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <StockNews props={symbol} />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar las noticias. Por favor
                    intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showStockScreener: {
          description:
            'This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.',
          parameters: z.object({}),
          generate: async function* ({ }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockScreener',
                    toolCallId,
                    args: {}
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockScreener',
                    toolCallId,
                    result: {}
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes el buscador de acciones. Puedes utilizar diferentes filtros para encontrar acciones que se ajusten a tus criterios.`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <StockScreener />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar el buscador. Por favor
                    intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showMarketOverview: {
          description: `This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showMarketOverview',
                    toolCallId,
                    args: {}
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showMarketOverview',
                    toolCallId,
                    result: {}
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes el resumen general del mercado. ¿Necesitas información sobre algún instrumento específico?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <MarketOverview />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar el resumen del mercado.
                    Por favor intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showMarketHeatmap: {
          description: `This tool shows a heatmap of today's stock market performance across sectors. It is preferred over showMarketOverview if asked specifically about the stock market.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showMarketHeatmap',
                    toolCallId,
                    args: {}
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showMarketHeatmap',
                    toolCallId,
                    result: {}
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes el mapa de calor del mercado por sectores. Los colores indican el rendimiento: verde para positivo y rojo para negativo.`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <MarketHeatmap />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar el mapa de calor. Por
                    favor intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showETFHeatmap: {
          description: `This tool shows a heatmap of today's ETF performance across sectors and asset classes. It is preferred over showMarketOverview if asked specifically about the ETF market.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showETFHeatmap',
                    toolCallId,
                    args: {}
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showETFHeatmap',
                    toolCallId,
                    result: {}
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes el mapa de calor de ETFs. ¿Necesitas información sobre algún ETF específico?`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <ETFHeatmap />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar el mapa de ETFs. Por
                    favor intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        },

        showTrendingStocks: {
          description: `This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            try {
              yield (
                <BotCard>
                  <></>
                </BotCard>
              )

              const toolCallId = nanoid()

              // Create and add tool messages to state
              const assistantMessage = {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showTrendingStocks',
                    toolCallId,
                    args: {}
                  }
                ]
              }

              const toolMessage = {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showTrendingStocks',
                    toolCallId,
                    result: {}
                  }
                ]
              }

              // Add both messages in one update
              aiState.done({
                ...aiState.get(),
                messages: [
                  ...aiState.get().messages,
                  assistantMessage,
                  toolMessage
                ]
              } as any)

              // Use a fixed caption to avoid API errors
              const caption = `Aquí tienes las acciones más populares del día. Incluye las que más han subido, las que más han caído y las más activas.`

              // Save immediately after each tool use
              await saveChatToDatabase(aiState.get())

              return (
                <BotCard>
                  <MarketTrending />
                  {caption && <div className="mt-2 text-sm">{caption}</div>}
                </BotCard>
              )
            } catch (error) {
              console.error('Error in tool:', error)
              return (
                <BotCard>
                  <div className="text-red-600">
                    Lo siento, hubo un error al mostrar las acciones populares.
                    Por favor intenta nuevamente.
                  </div>
                </BotCard>
              )
            }
          }
        }
      }
    })

    // Save state after successful streaming
    await saveChatToDatabase(aiState.get())

    return {
      id: nanoid(),
      display: result.value
    }
  } catch (err: any) {
    console.error('Error in submitUserMessage:', err)

    if (err.message.includes('OpenAI API key is missing.')) {
      err.message = 'La API Key de Groq no fue detectada en el proyecto.'
    }

    // Add a default user-friendly message to avoid exposing API error details
    if (err.message.includes('Bad Request')) {
      err.message =
        'Error de solicitud. Por favor intenta con una pregunta diferente.'
    }

    return {
      id: nanoid(),
      display: (
        <div className="border p-4">
          <div className="text-red-700 font-medium">Error: {err.message}</div>
          <p className="inline-flex items-center text-sm text-red-800 hover:text-red-900">
            Ocurrió un error, vuelve a intentarlo más tarde o contacta al
            desarrollador
          </p>
        </div>
      )
    }
  }
}

// In the saveChatToDatabase function
async function saveChatToDatabase(state: AIState) {
  'use server'

  try {
    const { userId } = await auth()

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string
      }
    })

    if (user?.subscriptionStatus === 'free') return

    // Generate a title from the first user message if available
    let title = 'Nueva conversación'
    const firstUserMessage = state.messages.find(m => m.role === 'user')
    if (firstUserMessage && typeof firstUserMessage.content === 'string') {
      title = firstUserMessage.content.substring(0, 40)
      if (firstUserMessage.content.length > 40) title += '...'
    }

    // Properly serialize complex message objects
    const serializedState = {
      ...state,
      messages: state.messages.map(msg => {
        let safeContent

        // Handle different content types properly
        if (typeof msg.content === 'object') {
          try {
            safeContent = JSON.stringify(msg.content)
          } catch (e) {
            console.error('Error stringifying message content:', e)
            safeContent = 'Error: Could not serialize content'
          }
        } else {
          safeContent = msg.content
        }

        return {
          ...msg,
          content: safeContent
        }
      })
    }

    // Save to database
    await prisma.chat.upsert({
      where: { id: state.chatId },
      update: {
        title,
        stateData: serializedState as any,
        updatedAt: new Date()
      },
      create: {
        id: state.chatId,
        title,
        userId: userId as string,
        stateData: serializedState as any
      }
    })

    return true
  } catch (error) {
    console.error('Error saving chat to database:', error)
    return false
  }
}

// Create a message display for UI based on message type
function createMessageDisplay(message: Message): React.ReactNode {
  // Handle user messages
  if (message.role === 'user') {
    return <UserMessage>{message.content as any}</UserMessage>
  }

  // Handle assistant messages with tool calls
  if (message.role === 'assistant' && typeof message.content === 'object') {
    if (
      Array.isArray(message.content) &&
      message.content[0]?.type === 'tool-call'
    ) {
      const toolCall = message.content[0] as any

      // Each tool gets a specific component
      switch (toolCall.toolName) {
        case 'showStockChart':
          return (
            <BotCard>
              <StockChart
                symbol={toolCall.args.symbol}
                comparisonSymbols={toolCall.args.comparisonSymbols || []}
              />
            </BotCard>
          )
        case 'showStockPrice':
          return (
            <BotCard>
              <StockPrice props={toolCall.args.symbol} />
            </BotCard>
          )
        case 'showStockFinancials':
          return (
            <BotCard>
              <StockFinancials props={toolCall.args.symbol} />
            </BotCard>
          )
        case 'showStockNews':
          return (
            <BotCard>
              <StockNews props={toolCall.args.symbol} />
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
          return <SpinnerMessage />
      }
    }
  }

  // Handle assistant text messages
  if (message.role === 'assistant') {
    const content =
      typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content)
    return <BotMessage content={content} />
  }

  // Tool messages are not displayed directly
  return null
}

// The AI component setup
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },

  // When AI state changes (and is done), save to database
  onSetAIState: async ({ state, done }) => {
    'use server'

    if (done) {
      await saveChatToDatabase(state)

      // Track message count for free users if this is a user action
      const { userId } = await auth()
      if (userId) {
        await prisma.user
          .update({
            where: { id: userId },
            data: { messageCount: { increment: 1 } }
          })
          .catch((e: any) => console.error('Failed to increment message count:', e))
      }
    }
  },

  // Convert AI state to UI state for display
  onGetUIState: async () => {
    'use server'

    const aiState = getAIState<any>()
    if (!aiState?.messages) return []

    // Convert messages to UI components
    return aiState.messages
      .filter((message: any) => message.role !== 'tool')
      .map((message: any) => ({
        id: message.id || nanoid(),
        display: createMessageDisplay(message)
      }))
  }
})
