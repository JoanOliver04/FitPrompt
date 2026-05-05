import { db } from '@/lib/db'
import { BadgeId } from '@prisma/client'

// ─── Definitions ──────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id:          BadgeId
  name:        string
  description: string
  icon:        string
}

// Add new badges here — no other file needs to change.
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id:          BadgeId.first_step,
    name:        'Primer Paso',
    description: 'Completaste el onboarding',
    icon:        '👟',
  },
  {
    id:          BadgeId.week_1,
    name:        'Semana 1',
    description: 'Completaste tu primera semana',
    icon:        '🗓️',
  },
  {
    id:          BadgeId.consistency,
    name:        'Constancia',
    description: 'Entrenaste 7 días seguidos',
    icon:        '🔥',
  },
  {
    id:          BadgeId.weigher,
    name:        'Pesador',
    description: 'Registraste tu peso 7 días seguidos',
    icon:        '⚖️',
  },
]

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * Awards a badge to the user. Idempotent — silently returns false if already
 * awarded (unique constraint), or true if this was the first time.
 */
export async function awardBadge(userId: string, badge: BadgeId): Promise<boolean> {
  try {
    await db.achievement.create({ data: { userId, badge } })
    return true
  } catch {
    return false
  }
}

// ─── Consecutive-days helpers ─────────────────────────────────────────────────

function dayKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns true if the user has completed workouts on every one of the last `days` days. */
async function hasConsecutiveWorkoutDays(userId: string, days: number): Promise<boolean> {
  const logs = await db.workoutLog.findMany({
    where:  { userId, completed: true, date: { gte: daysAgo(days - 1) } },
    select: { date: true },
  })

  const present = new Set(logs.map(l => dayKey(l.date)))
  for (let i = 0; i < days; i++) {
    if (!present.has(dayKey(daysAgo(i)))) return false
  }
  return true
}

/** Returns true if the user has logged weight on every one of the last `days` days. */
async function hasConsecutiveWeightDays(userId: string, days: number): Promise<boolean> {
  const logs = await db.weightLog.findMany({
    where:  { userId, date: { gte: daysAgo(days - 1) } },
    select: { date: true },
  })

  const present = new Set(logs.map(l => dayKey(l.date)))
  for (let i = 0; i < days; i++) {
    if (!present.has(dayKey(daysAgo(i)))) return false
  }
  return true
}

// ─── Check-and-award triggers ─────────────────────────────────────────────────

export async function checkAndAwardConsistency(userId: string): Promise<BadgeDefinition | null> {
  if (await hasConsecutiveWorkoutDays(userId, 7)) {
    const awarded = await awardBadge(userId, BadgeId.consistency)
    return awarded ? (BADGE_DEFINITIONS.find(b => b.id === BadgeId.consistency) ?? null) : null
  }
  return null
}

export async function checkAndAwardWeigher(userId: string): Promise<BadgeDefinition | null> {
  if (await hasConsecutiveWeightDays(userId, 7)) {
    const awarded = await awardBadge(userId, BadgeId.weigher)
    return awarded ? (BADGE_DEFINITIONS.find(b => b.id === BadgeId.weigher) ?? null) : null
  }
  return null
}
