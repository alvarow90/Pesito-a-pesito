import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { nanoid } from '@/lib/utils'

/**
 * Get all chats for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true }
    })

    // Only premium users can access chat history
    if (!user || user.subscriptionStatus !== 'premium') {
      return NextResponse.json({ chats: [] })
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Chats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
/**
 * Create a new chat
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true }
    })

    // Only premium users can create saved chats
    if (!user || user.subscriptionStatus !== 'premium') {
      // Generate a chat ID but don't save it
      return NextResponse.json({
        chatId: nanoid(),
        saved: false
      })
    }

    const { chatId, title } = await req.json()

    const newChat = await prisma.chat.create({
      data: {
        id: chatId || nanoid(),
        title: title || 'New Chat',
        userId
      }
    })

    return NextResponse.json({
      chatId: newChat.id,
      saved: true
    })
  } catch (error) {
    console.error('Chat creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}
