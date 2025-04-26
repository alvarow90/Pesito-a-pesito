import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

/**
 * Reset the user's message count (for free users)
 */
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, subscriptionStatus: true }
    })

    // If user doesn't exist or is premium, no need to reset
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Reset the message count to zero
    await prisma.user.update({
      where: { id: userId },
      data: {
        messageCount: 0
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting message count:', error)
    return NextResponse.json(
      { error: 'Failed to reset message count' },
      { status: 500 }
    )
  }
}
