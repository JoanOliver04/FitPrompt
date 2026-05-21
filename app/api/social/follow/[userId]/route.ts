import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyNewFollower } from '@/lib/notifications'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const followerId  = session.user.id
  const { userId: followingId } = await params

  if (followerId === followingId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

  const target = await db.user.findUnique({
    where:  { id: followingId },
    select: { id: true, isPublic: true },
  })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (target.isPublic) {
    await db.follow.upsert({
      where:  { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    })
    // Cancel any stale follow request
    await db.followRequest.deleteMany({ where: { fromUserId: followerId, toUserId: followingId } })
    notifyNewFollower(followerId, followingId).catch(() => undefined)
    return NextResponse.json({ ok: true, status: 'following' })
  }

  // Private account — create or return existing follow request
  const existing = await db.followRequest.findUnique({
    where: { fromUserId_toUserId: { fromUserId: followerId, toUserId: followingId } },
  })
  if (existing) return NextResponse.json({ ok: true, status: 'pending' })

  await db.followRequest.create({ data: { fromUserId: followerId, toUserId: followingId } })
  return NextResponse.json({ ok: true, status: 'pending' })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const followerId  = session.user.id
  const { userId: followingId } = await params

  // Try unfollow first, then cancel pending request
  const deleted = await db.follow.deleteMany({ where: { followerId, followingId } })
  if (deleted.count === 0) {
    await db.followRequest.deleteMany({ where: { fromUserId: followerId, toUserId: followingId } })
  }

  return NextResponse.json({ ok: true })
}
