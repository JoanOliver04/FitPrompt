import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import type { Role } from '@/types'

export function checkRole(userRole: Role, required: Role): boolean {
  if (required === 'USER') return true
  return userRole === required
}

/**
 * Server Component guard — redirects if the caller is not an ADMIN.
 * Returns the session when the check passes.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/403')

  return session
}

/**
 * API Route guard — returns a NextResponse (401/403) when the check fails,
 * or null when the caller is an ADMIN and may proceed.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
