import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyLimits } from '@/lib/limits'
import { db } from '@/lib/db'
import { notifyNewFollower } from '@/lib/notifications'
import type { Plan } from '@/types'

// ─── POST — follow ────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = {
    id: session.user.id,
    plan: (session.user as { plan?: Plan }).plan ?? 'free',
  }

  const blocked = await applyLimits(user, { type: 'premium_feature', feature: 'social_groups' })
  if (blocked) return blocked

  const followerId  = user.id
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

  // Notify the followed user (fire-and-forget)
  notifyNewFollower(followerId, followingId).catch(() => undefined)

  const followersCount = await db.follow.count({ where: { followingId } })
  return NextResponse.json({ ok: true, followersCount })
}

// ─── DELETE — unfollow ────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const followerId  = session.user.id
  const followingId = params.userId

  await db.follow.deleteMany({ where: { followerId, followingId } })

  const followersCount = await db.follow.count({ where: { followingId } })
  return NextResponse.json({ ok: true, followersCount })
}
