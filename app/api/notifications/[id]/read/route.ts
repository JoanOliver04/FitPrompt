import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { cuidString } from '@/lib/schemas'

export const runtime = 'nodejs'

export const PATCH = defineHandler(
  {
    auth: 'session',
    params: ({ id }) => ({ id: cuidString.parse(id) }),
    rateLimit: { key: ({ userId }) => `notif:${userId}`, limit: 60, windowSec: 60 },
  },
  async ({ session, params }) => {
    await db.notification.updateMany({
      where: { id: params.id, userId: session.user.id },
      data:  { read: true },
    })
    return NextResponse.json({ ok: true })
  },
)
