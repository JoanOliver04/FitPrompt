import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── POST — follow ────────────────────────────────────────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
