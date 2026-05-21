import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET — list pending group invitations received by the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ invitations: [] })

  const invitations = await db.groupInvitation.findMany({
    where:   { inviteeId: session.user.id },
    include: {
      group:   { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invitations })
}
