import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Optional: Add verification with Etherscan API
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, txHash, walletAddress } = await req.json()

    if (plan !== 'premium') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // En modo de demostración, asumimos que la transacción es válida
    let isVerified = true

    // Create or update user in our DB
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        subscriptionStatus: 'premium'
      },
      create: {
        id: userId,
        subscriptionStatus: 'premium'
      }
    })

    // Calculate subscription end date (1 month from now)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Delete any existing subscription
    await prisma.subscription.deleteMany({
      where: {
        userId
      }
    })

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        status: 'active',
        type: 'monthly',
        startDate: new Date(),
        endDate,
        txHash: txHash || undefined
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
