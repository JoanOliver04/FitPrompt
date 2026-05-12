import { NextRequest, NextResponse } from 'next/server'
import { generatePlan } from '@/lib/ai'
import { calculateAge } from '@/lib/age'
import type { UserProfile } from '@/types'

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof UserProfile)[] = [
  'userId',
  'birthDate',
  'weight',
  'height',
  'gender',
  'goal',
  'level',
  'daysPerWeek',
  'sessionTime',
  'workoutType',
  'schedule',
]

function validateProfile(body: unknown): UserProfile | string {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object'

  const b = body as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    if (b[field] === undefined || b[field] === null) {
      return `Missing required field: ${field}`
    }
  }

  const birthDate = new Date(b.birthDate as string)
  if (isNaN(birthDate.getTime())) return 'birthDate must be a valid ISO date string'

  const age = calculateAge(birthDate)
  if (age < 13 || age > 100) return 'age derived from birthDate must be between 13 and 100'

  if (typeof b.weight !== 'number' || b.weight < 20 || b.weight > 400) return 'weight must be a number between 20 and 400'
  if (typeof b.height !== 'number' || b.height < 100 || b.height > 250) return 'height must be a number between 100 and 250'
  if (typeof b.daysPerWeek !== 'number' || b.daysPerWeek < 1 || b.daysPerWeek > 7) return 'daysPerWeek must be between 1 and 7'

  return {
    ...(b as unknown as UserProfile),
    birthDate,
    foodPreferences: Array.isArray(b.foodPreferences) ? b.foodPreferences : [],
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const profileOrError = validateProfile(body)
  if (typeof profileOrError === 'string') {
    return NextResponse.json({ error: profileOrError }, { status: 400 })
  }

  try {
    const { rutina, dieta, recuperacion, hojaDeRuta, faq } = await generatePlan(profileOrError)
    return NextResponse.json({ rutina, dieta, recuperacion, hojaDeRuta, faq })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
