import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { defineHandler } from '@/lib/api-handler'
import {
  getCurrentWeekCheckIn,
  saveCheckIn,
  updateCheckInSuggestions,
  generateSuggestions,
} from '@/lib/checkin'
import { checkInSchema } from '@/lib/schemas'
import { stripHtml } from '@/lib/sanitize'

export const runtime = 'nodejs'

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const checkIn = await getCurrentWeekCheckIn(session.user.id)
  return NextResponse.json({
    hasCheckIn: checkIn !== null,
    checkIn: checkIn
      ? {
          id: checkIn.id,
          response: checkIn.response,
          aiSuggestions: checkIn.aiSuggestions ? (JSON.parse(checkIn.aiSuggestions) as string[]) : null,
        }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export const POST = defineHandler(
  {
    auth: 'session',
    body: checkInSchema,
    maxBodyBytes: 8 * 1024,
    rateLimit: { key: ({ userId }) => `checkin:${userId}`, limit: 5, windowSec: 60 * 60 },
  },
  async ({ session, body }) => {
    const safe = stripHtml(body.response)
    const checkIn = await saveCheckIn(session.user.id, safe)
    const suggestions = await generateSuggestions(safe)
    await updateCheckInSuggestions(checkIn.id, suggestions)
    return NextResponse.json({ checkIn, suggestions })
  },
)
