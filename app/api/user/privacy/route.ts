import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { isPublic?: boolean }
  if (typeof body.isPublic !== 'boolean') {
    return NextResponse.json({ error: 'isPublic must be boolean' }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data:  { isPublic: body.isPublic },
  })

  return NextResponse.json({ ok: true, isPublic: body.isPublic })
}
