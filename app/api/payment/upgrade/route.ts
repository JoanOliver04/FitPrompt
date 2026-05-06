import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Plan } from '@/types'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const plan = (session.user as { plan?: Plan }).plan ?? 'free'
  if (plan === 'premium') {
    return NextResponse.json({ error: 'Already on Premium plan' }, { status: 400 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { plan: 'premium' },
  })

  return NextResponse.json({ ok: true })
}
