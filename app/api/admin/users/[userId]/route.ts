import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { cuidString } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export const DELETE = defineHandler(
  {
    auth: 'admin',
    params: ({ userId }) => ({ userId: cuidString.parse(userId) }),
    rateLimit: { key: ({ userId }) => `admin-delete:${userId}`, limit: 30, windowSec: 60 },
  },
  async ({ session, params }) => {
    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta desde el panel' },
        { status: 400 },
      )
    }

    const target = await db.user.findUnique({
      where:  { id: params.userId },
      select: { role: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    if (target.role === 'ADMIN') {
      return NextResponse.json({ error: 'No puedes eliminar a otro administrador' }, { status: 403 })
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'admin.delete_user',
        target: params.userId,
      },
    }).catch((err) => logger.warn('audit_log_failed', { err: String(err) }))

    await db.user.delete({ where: { id: params.userId } })

    logger.info('admin_deleted_user', { adminId: session.user.id, targetId: params.userId })
    return NextResponse.json({ ok: true })
  },
)
