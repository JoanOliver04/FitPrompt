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
    const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
