import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyLimits } from '@/lib/limits'
import { db } from '@/lib/db'
import type { Plan } from '@/types'

// ─── POST — create group ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = {
    id: session.user.id,
    plan: (session.user as { plan?: Plan }).plan ?? 'free',
    role: session.user.role,
  }

  const blocked = await applyLimits(user, { type: 'premium_feature', feature: 'social_groups' })
  if (blocked) return blocked

  const body = await req.json() as { name?: string }
  const name = body.name?.trim()

  if (!name || name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: 'El nombre debe tener entre 2 y 60 caracteres' },
      { status: 400 },
    )
  }

  const group = await db.group.create({
    data: {
      name,
      createdBy: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
    select: { id: true, name: true, createdBy: true, createdAt: true },
  })

  return NextResponse.json(group, { status: 201 })
}
