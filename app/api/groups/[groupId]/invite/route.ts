import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { groupInviteSchema, cuidString } from '@/lib/schemas'

export const runtime = 'nodejs'

export const POST = defineHandler(
  {
    auth: 'session',
    body: groupInviteSchema,
    params: ({ groupId }) => ({ groupId: cuidString.parse(groupId) }),
    rateLimit: { key: ({ userId }) => `group-invite:${userId}`, limit: 30, windowSec: 60 * 60 },
    maxBodyBytes: 2 * 1024,
  },
  async ({ session, body, params }) => {
    const group = await db.group.findUnique({
      where:  { id: params.groupId },
      select: { id: true, createdBy: true },
    })
    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    }
    if (group.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Solo el creador puede invitar' }, { status: 403 })
    }

    const target = await db.user.findUnique({ where: { id: body.userId }, select: { id: true } })
    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    if (target.id === session.user.id) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
    }

    await db.groupMember.upsert({
      where:  { groupId_userId: { groupId: params.groupId, userId: target.id } },
      create: { groupId: params.groupId, userId: target.id },
      update: {},
    })

    return NextResponse.json({ ok: true })
  },
)
