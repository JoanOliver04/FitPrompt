import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { groupCreateSchema } from '@/lib/schemas'
import { checkAndAwardGroupFounder } from '@/lib/badges'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    body: groupCreateSchema,
    planLimit: { type: 'premium_feature', feature: 'social_groups' },
    rateLimit: { key: ({ userId }) => `group:${userId}`, limit: 5, windowSec: 60 * 60 },
    maxBodyBytes: 4 * 1024,
  },
  async ({ session, body }) => {
    const group = await db.group.create({
      data: {
        name: body.name,
        createdBy: session.user.id,
        members: { create: { userId: session.user.id } },
      },
      select: { id: true, name: true, createdBy: true, createdAt: true },
    })
    checkAndAwardGroupFounder(session.user.id).catch((err) => logger.warn('badge_group_failed', { userId: session.user.id, err: String(err) }))
    return NextResponse.json(group, { status: 201 })
  },
)
