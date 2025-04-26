import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

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

    // Add a small delay to ensure we get the latest data (fixes race conditions)
    await new Promise(resolve => setTimeout(resolve, 300))

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

    // Set cache-control headers to prevent browser caching
    return NextResponse.json(
      { chats },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    )
  } catch (error) {
    console.error('Chats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', chats: [] },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
