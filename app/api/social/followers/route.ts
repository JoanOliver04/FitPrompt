import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const follows = await db.follow.findMany({
    where:   { followingId: session.user.id },
    select:  {
      createdAt: true,
      follower: { select: { id: true, name: true, image: true, plan: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    followers: follows.map(f => ({ ...f.follower, followedAt: f.createdAt })),
  })
}
