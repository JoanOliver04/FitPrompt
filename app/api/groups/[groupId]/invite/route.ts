import { NextResponse } from 'next/server'
import { defineHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'
import { groupInviteSchema, cuidString } from '@/lib/schemas'

// POST — send a group invitation (only to mutual follows, only creator)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const inviterId = session.user.id

  const group = await db.group.findUnique({
    where:  { id: groupId },
    select: { id: true, name: true, createdBy: true },
  })
  if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
  if (group.createdBy !== inviterId) return NextResponse.json({ error: 'Solo el creador puede invitar' }, { status: 403 })

  const body = await req.json() as { userId?: string }
  const inviteeId = body.userId
  if (!inviteeId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  // Verify mutual follow
  const [iFollow, theyFollow] = await Promise.all([
    db.follow.findUnique({ where: { followerId_followingId: { followerId: inviterId, followingId: inviteeId } } }),
    db.follow.findUnique({ where: { followerId_followingId: { followerId: inviteeId, followingId: inviterId } } }),
  ])
  if (!iFollow || !theyFollow) {
    return NextResponse.json({ error: 'Solo puedes invitar a contactos mutuos' }, { status: 403 })
  }

  // Not already a member
  const isMember = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: inviteeId } },
  })
  if (isMember) return NextResponse.json({ error: 'Ya es miembro' }, { status: 409 })

  // Upsert invitation (idempotent)
  await db.groupInvitation.upsert({
    where:  { groupId_inviteeId: { groupId, inviteeId } },
    create: { groupId, inviterId, inviteeId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
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
