import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ invitationId: string }> }

// POST — accept group invitation
export async function POST(
  _req: NextRequest,
  { params }: Params,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invitationId } = await params
  const userId = session.user.id

  const invitation = await db.groupInvitation.findUnique({ where: { id: invitationId } })
  if (!invitation || invitation.inviteeId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.$transaction([
    db.groupMember.upsert({
      where:  { groupId_userId: { groupId: invitation.groupId, userId } },
      create: { groupId: invitation.groupId, userId },
      update: {},
    }),
    db.groupInvitation.delete({ where: { id: invitationId } }),
  ])

  return NextResponse.json({ ok: true, groupId: invitation.groupId })
}

// DELETE — reject group invitation
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invitationId } = await params

  await db.groupInvitation.deleteMany({
    where: { id: invitationId, inviteeId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
