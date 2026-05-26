import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { groupInviteSchema, cuidString } from '@/lib/schemas'
import { notifyGroupInvite } from '@/lib/notifications'

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
    const inviterId = session.user.id
    const { groupId } = params
    const inviteeId  = body.userId

    const group = await db.group.findUnique({
      where:  { id: groupId },
      select: { id: true, name: true, createdBy: true },
    })
    if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    if (group.createdBy !== inviterId) return NextResponse.json({ error: 'Solo el creador puede invitar' }, { status: 403 })

    if (inviteeId === inviterId) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id: inviteeId }, select: { id: true } })
    if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    // Verify mutual follow
    const [iFollow, theyFollow] = await Promise.all([
      db.follow.findUnique({ where: { followerId_followingId: { followerId: inviterId, followingId: inviteeId } } }),
      db.follow.findUnique({ where: { followerId_followingId: { followerId: inviteeId, followingId: inviterId } } }),
    ])
    if (!iFollow || !theyFollow) {
      return NextResponse.json({ error: 'Solo puedes invitar a contactos mutuos' }, { status: 403 })
    }

    // Already a member?
    const isMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: inviteeId } },
    })
    if (isMember) return NextResponse.json({ error: 'Ya es miembro' }, { status: 409 })

    const existingInvite = await db.groupInvitation.findUnique({
      where: { groupId_inviteeId: { groupId, inviteeId } },
    })

    await db.groupInvitation.upsert({
      where:  { groupId_inviteeId: { groupId, inviteeId } },
      create: { groupId, inviterId, inviteeId },
      update: {},
    })

    // Fire-and-forget: only notify on fresh invitations
    if (!existingInvite) {
      notifyGroupInvite(inviterId, inviteeId, groupId, group.name).catch(() => null)
    }

    return NextResponse.json({ ok: true })
  },
)
