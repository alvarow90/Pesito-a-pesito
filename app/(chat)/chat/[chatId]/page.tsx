import { redirect } from 'next/navigation'
import { getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ChatPageParams {
  params: {
    chatId: string
  }
}

export default async function ChatPage({ params }: ChatPageParams) {
  const { chatId } = params

  const missingKeys = await getMissingKeys()
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect('/sign-in?redirect_url=' + encodeURIComponent(`/chat/${chatId}`))
  }

  let error = null
  let initialAIState = { chatId, messages: [] } as any

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true }
    })

    if (!dbUser || dbUser.subscriptionStatus !== 'premium') {
      redirect('/')
    }

    // Add a small delay to ensure database operations have completed
    await new Promise(resolve => setTimeout(resolve, 200))

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId
      }
    })

    // If chat doesn't exist or belongs to another user, redirect to home
    if (!chat) {
      console.error('Chat not found or access denied:', chatId)
      redirect('/')
    }

    initialAIState = (chat.stateData as any) || { chatId, messages: [] }

    if (initialAIState.messages) {
      // Handle message content parsing correctly
      initialAIState.messages = initialAIState.messages.map((msg: any) => {
        if (typeof msg.content === 'string') {
          try {
            // Check if content is stored as JSON string
            if (msg.content.startsWith('[{') || msg.content.startsWith('{')) {
              msg.content = JSON.parse(msg.content)
            }
          } catch (e) {
            console.error('Failed to parse message content:', e)
            // Keep content as string if parsing fails
          }
        }
        return msg
      })
    }

    // Ensure chatId is correctly set
    initialAIState.chatId = chatId
  } catch (e) {
    console.error('Error loading chat:', e)
    error = 'Error al cargar la conversación'
    // Redirect to home on error
    redirect('/')
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center h-[calc(100vh-4rem)] max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (missingKeys.length > 0) {
    return (
      <div className="container flex flex-col items-center justify-center h-[calc(100vh-4rem)] max-w-2xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de configuración</AlertTitle>
          <AlertDescription>
            Faltan claves de entorno necesarias para el funcionamiento de la
            aplicación.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="">
      <AI initialAIState={initialAIState} initialUIState={[]}>
        <Chat id={chatId} missingKeys={missingKeys} />
      </AI>
    </div>
  )
}

export const dynamic = 'force-dynamic'
