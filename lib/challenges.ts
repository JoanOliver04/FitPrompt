import { db } from '@/lib/db'

// ─── Definitions ──────────────────────────────────────────────────────────────

export interface ChallengeDefinition {
  id:          string
  title:       string
  description: string
  icon:        string
  xpReward:    number
  type:        'workout_days' | 'weight_days' | 'workout_complete'
  target:      number
}

export const WEEKLY_CHALLENGES: ChallengeDefinition[] = [
  {
    id:          'workout_5_days',
    title:       'Guerrero semanal',
    description: 'Entrena 5 días esta semana',
    icon:        '🏋️',
    xpReward:    200,
    type:        'workout_days',
    target:      5,
  },
  {
    id:          'workout_3_complete',
    title:       'Triple amenaza',
    description: 'Completa 3 entrenamientos esta semana',
    icon:        '🔥',
    xpReward:    100,
    type:        'workout_complete',
    target:      3,
  },
  {
    id:          'weight_7_days',
    title:       'Control total',
    description: 'Registra tu peso 7 días esta semana',
    icon:        '⚖️',
    xpReward:    150,
    type:        'weight_days',
    target:      7,
  },
]

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getWeekStart(): Date {
  const now  = new Date()
  const day  = now.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekEnd(): Date {
  const end = new Date(getWeekStart())
  end.setDate(end.getDate() + 7)
  return end
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getChallengeProgress(userId: string, challengeId: string): Promise<number> {
  const def = WEEKLY_CHALLENGES.find(c => c.id === challengeId)
  if (!def) return 0

  const weekStart = getWeekStart()
  const weekEnd   = getWeekEnd()

  switch (def.type) {
    case 'workout_days': {
      const logs = await db.workoutLog.findMany({
        where:  { userId, date: { gte: weekStart, lt: weekEnd } },
        select: { date: true },
      })
      return new Set(logs.map(l => l.date.toISOString().split('T')[0])).size
    }
    case 'weight_days': {
      const logs = await db.weightLog.findMany({
        where:  { userId, date: { gte: weekStart, lt: weekEnd } },
        select: { date: true },
      })
      return new Set(logs.map(l => l.date.toISOString().split('T')[0])).size
    }
    case 'workout_complete': {
      return db.workoutLog.count({
        where: { userId, completed: true, date: { gte: weekStart, lt: weekEnd } },
      })
    }
  }
}
