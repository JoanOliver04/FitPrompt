import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── GET — list notifications ─────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take:    30,
      select: {
        id:        true,
        type:      true,
        title:     true,
        body:      true,
        href:      true,
        read:      true,
        createdAt: true,
      },
    }),
    db.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ])

  return NextResponse.json({
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  })
}

// ─── PATCH — mark all as read ─────────────────────────────────────────────────

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.notification.updateMany({
    where:  { userId: session.user.id, read: false },
    data:   { read: true },
  })

  return NextResponse.json({ ok: true })
}

// ─── DELETE — delete all notifications ───────────────────────────────────────

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.notification.deleteMany({ where: { userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
