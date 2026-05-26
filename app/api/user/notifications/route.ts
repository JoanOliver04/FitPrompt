import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export interface NotificationPrefs {
  new_follower:  boolean
  group_invite:  boolean
  rank_surpassed: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  new_follower:  true,
  group_invite:  true,
  rank_surpassed: true,
}

function parsePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS }
  const obj = raw as Record<string, unknown>
  return {
    new_follower:   typeof obj.new_follower   === 'boolean' ? obj.new_follower   : DEFAULT_PREFS.new_follower,
    group_invite:   typeof obj.group_invite   === 'boolean' ? obj.group_invite   : DEFAULT_PREFS.group_invite,
    rank_surpassed: typeof obj.rank_surpassed === 'boolean' ? obj.rank_surpassed : DEFAULT_PREFS.rank_surpassed,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { notificationPrefs: true },
  })

  return NextResponse.json(parsePrefs(user?.notificationPrefs))
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: Partial<NotificationPrefs>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { notificationPrefs: true },
  })
  const current = parsePrefs(user?.notificationPrefs)

  const updated: NotificationPrefs = {
    new_follower:   typeof body.new_follower   === 'boolean' ? body.new_follower   : current.new_follower,
    group_invite:   typeof body.group_invite   === 'boolean' ? body.group_invite   : current.group_invite,
    rank_surpassed: typeof body.rank_surpassed === 'boolean' ? body.rank_surpassed : current.rank_surpassed,
  }

  await db.user.update({
    where: { id: session.user.id },
    data:  { notificationPrefs: updated as unknown as Record<string, boolean> },
  })

  return NextResponse.json(updated)
}
