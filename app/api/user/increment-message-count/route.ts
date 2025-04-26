import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

/**
 * Increment the user's message count for free users
 */
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, messageCount: true, subscriptionStatus: true }
    })

    // If user doesn't exist in our database yet, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          messageCount: 0,
          subscriptionStatus: 'free'
        }
      })
    }

    // Premium users don't need to track message counts
    if (user.subscriptionStatus === 'premium') {
      return NextResponse.json({ messageCount: 0 })
    }

    // Increment the message count for free users
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: {
          increment: 1
        }
      },
      select: {
        messageCount: true
      }
    })

    return NextResponse.json({ messageCount: updatedUser.messageCount })
  } catch (error) {
    console.error('Error incrementing message count:', error)
    return NextResponse.json(
      { error: 'Failed to increment message count' },
      { status: 500 }
    )
  }
}
