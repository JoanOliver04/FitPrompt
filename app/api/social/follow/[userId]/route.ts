import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { notifyNewFollower } from '@/lib/notifications'
import { cuidString } from '@/lib/schemas'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    params: ({ userId }) => ({ userId: cuidString.parse(userId) }),
    rateLimit: { key: ({ userId }) => `follow:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, params }) => {
    const followerId  = session.user.id
    const followingId = params.userId

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }
    const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

<<<<<<< HEAD
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
=======
    await db.follow.upsert({
      where:  { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    })
    notifyNewFollower(followerId, followingId).catch(() => undefined)

    const followersCount = await db.follow.count({ where: { followingId } })
    return NextResponse.json({ ok: true, followersCount })
  },
)

export const DELETE = defineHandler(
  {
    auth: 'session',
    params: ({ userId }) => ({ userId: cuidString.parse(userId) }),
    rateLimit: { key: ({ userId }) => `unfollow:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, params }) => {
    const followerId  = session.user.id
    const followingId = params.userId
    await db.follow.deleteMany({ where: { followerId, followingId } })
    const followersCount = await db.follow.count({ where: { followingId } })
    return NextResponse.json({ ok: true, followersCount })
  },
)
>>>>>>> 50ff8beb8cb4f9cc82869bb45a03f0889f50bc99
