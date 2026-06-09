import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { cuidString } from '@/lib/schemas'

export const runtime = 'nodejs'

// Deletes a group. Only the creator may delete it. GroupMember and
// GroupInvitation rows cascade automatically (onDelete: Cascade on groupId).
export const DELETE = defineHandler(
  {
    auth: 'session',
    params: ({ groupId }) => ({ groupId: cuidString.parse(groupId) }),
    rateLimit: { key: ({ userId }) => `group-delete:${userId}`, limit: 20, windowSec: 60 * 60 },
  },
  async ({ session, params }) => {
    const { groupId } = params

    const group = await db.group.findUnique({
      where:  { id: groupId },
      select: { createdBy: true },
    })
    if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    if (group.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Solo el creador puede eliminar el grupo' }, { status: 403 })
    }

    await db.group.delete({ where: { id: groupId } })

    return NextResponse.json({ ok: true })
  },
)
