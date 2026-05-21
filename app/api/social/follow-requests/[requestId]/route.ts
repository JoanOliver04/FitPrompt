import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyNewFollower } from '@/lib/notifications'

type Params = { params: Promise<{ requestId: string }> }

// POST — accept follow request
export async function POST(
  _req: NextRequest,
  { params }: Params,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const userId = session.user.id

  const request = await db.followRequest.findUnique({ where: { id: requestId } })
  if (!request || request.toUserId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.$transaction([
    db.follow.upsert({
      where:  { followerId_followingId: { followerId: request.fromUserId, followingId: userId } },
      create: { followerId: request.fromUserId, followingId: userId },
      update: {},
    }),
    db.followRequest.delete({ where: { id: requestId } }),
  ])

  notifyNewFollower(request.fromUserId, userId).catch(() => undefined)

  return NextResponse.json({ ok: true })
}

// DELETE — reject follow request
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params

  await db.followRequest.deleteMany({
    where: { id: requestId, toUserId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
