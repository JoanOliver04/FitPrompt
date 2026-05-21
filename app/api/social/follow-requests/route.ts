import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET — list pending follow requests received by the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ requests: [] })

  const requests = await db.followRequest.findMany({
    where:   { toUserId: session.user.id },
    include: { from: { select: { id: true, name: true, image: true, plan: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}
