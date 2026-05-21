import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { notifyNewFollower } from '@/lib/notifications'
import { cuidString } from '@/lib/schemas'

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

    const target = await db.user.findUnique({
      where:  { id: followingId },
      select: { id: true, isPublic: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (target.isPublic) {
      await db.follow.upsert({
        where:  { followerId_followingId: { followerId, followingId } },
        create: { followerId, followingId },
        update: {},
      })
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

    const deleted = await db.follow.deleteMany({ where: { followerId, followingId } })
    if (deleted.count === 0) {
      await db.followRequest.deleteMany({ where: { fromUserId: followerId, toUserId: followingId } })
    }

    return NextResponse.json({ ok: true })
  },
)
