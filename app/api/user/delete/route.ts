import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function DELETE(): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Audit log BEFORE delete so the cascade does not wipe the trail.
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'user.self_delete',
      target: session.user.id,
    },
  }).catch((err) => logger.warn('audit_log_failed', { err: String(err) }))

  await db.user.delete({ where: { id: session.user.id } })

  logger.info('user_self_deleted', { userId: session.user.id })
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
