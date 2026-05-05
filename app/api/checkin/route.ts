import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getCurrentWeekCheckIn,
  saveCheckIn,
  updateCheckInSuggestions,
  generateSuggestions,
} from '@/lib/checkin'

export async function GET() {
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
          aiSuggestions: checkIn.aiSuggestions
            ? (JSON.parse(checkIn.aiSuggestions) as string[])
            : null,
        }
      : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const response = (body as Record<string, unknown>)?.response
  if (typeof response !== 'string' || !response.trim()) {
    return NextResponse.json({ error: 'response must be a non-empty string' }, { status: 400 })
  }

  const checkIn = await saveCheckIn(session.user.id, response.trim())
  const suggestions = await generateSuggestions(response.trim())
  await updateCheckInSuggestions(checkIn.id, suggestions)

  return NextResponse.json({ checkIn, suggestions })
}
