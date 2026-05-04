import { db } from '@/lib/db'
import { resolveStreak } from '@/lib/streak'

export interface DashboardData {
  name:                  string
  streak:                number
  bestStreak:            number
  weekComplete:          boolean
  weight:                number | null
  completionRate:        number
  xpLevel:               number
  xpLevelName:           string
  xpCurrent:             number
  xpMax:                 number
  completedDaysThisWeek: number[] // 0=Mon … 6=Sun
}

const XP_PER_WORKOUT     = 10
const XP_PER_ACHIEVEMENT = 50
const XP_PER_LEVEL       = 200
const LEVEL_NAMES        = ['Novato', 'Activo', 'Consistente', 'Atleta', 'Beast', 'Elite']

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function subDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() - n)
  return c
}

function getMondayOfWeek(d: Date): Date {
  const c   = new Date(d)
  const day = c.getDay()
  const diff = day === 0 ? -6 : 1 - day
  c.setDate(c.getDate() + diff)
  c.setHours(0, 0, 0, 0)
  return c
}

function toWeekIndex(d: Date): number {
  const raw = d.getDay()
  return raw === 0 ? 6 : raw - 1 // Mon=0 … Sun=6
}

function calculateWeeklyCompletion(dates: Date[], daysPerWeek: number): number {
  const monday      = getMondayOfWeek(new Date())
  const today       = startOfDay(new Date())
  const dayIndex    = toWeekIndex(today)
  const daysElapsed = dayIndex + 1
  const expected    = Math.min(daysPerWeek, daysElapsed)
  if (expected === 0) return 0
  const completed = dates.filter(d => {
    const day = startOfDay(d)
    return day >= monday && day <= today
  }).length
  return Math.round(Math.min(completed / expected, 1) * 100)
}

function getCompletedDaysThisWeek(dates: Date[]): number[] {
  const monday  = getMondayOfWeek(new Date())
  const today   = startOfDay(new Date())
  const indices = new Set<number>()
  for (const d of dates) {
    const day = startOfDay(d)
    if (day >= monday && day <= today) indices.add(toWeekIndex(day))
  }
  return Array.from(indices)
}

function calculateXP(
  workoutCount:     number,
  achievementCount: number,
): { level: number; levelName: string; current: number; max: number } {
  const totalXP = workoutCount * XP_PER_WORKOUT + achievementCount * XP_PER_ACHIEVEMENT
  const level   = Math.max(1, Math.floor(totalXP / XP_PER_LEVEL) + 1)
  return {
    level,
    levelName: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    current:   totalXP % XP_PER_LEVEL,
    max:       XP_PER_LEVEL,
  }
}

export async function getDashboardData(
  userId:   string,
  userName: string,
): Promise<DashboardData> {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const [latestWeight, workoutLogs, achievementCount, profile] = await Promise.all([
    db.weightLog.findFirst({
      where:   { userId },
      orderBy: { date: 'desc' },
      select:  { weight: true },
    }),
    db.workoutLog.findMany({
      where:   { userId, completed: true, date: { gte: thirtyDaysAgo } },
      select:  { date: true },
      orderBy: { date: 'desc' },
    }),
    db.achievement.count({ where: { userId } }),
    db.userProfile.findUnique({
      where:  { userId },
      select: { daysPerWeek: true, weight: true },
    }),
  ])

  const daysPerWeek    = profile?.daysPerWeek ?? 4
  const completedDates = workoutLogs.map(l => l.date)
  const xp             = calculateXP(workoutLogs.length, achievementCount)
  const streakData     = await resolveStreak(userId, daysPerWeek)

  // Prefer logged weight over profile weight (onboarding value)
  const weight = latestWeight?.weight ?? profile?.weight ?? null

  return {
    name:                  userName.split(' ')[0] || 'Atleta',
    streak:                streakData.currentStreak,
    bestStreak:            streakData.bestStreak,
    weekComplete:          streakData.weekComplete,
    weight,
    completionRate:        calculateWeeklyCompletion(completedDates, daysPerWeek),
    xpLevel:               xp.level,
    xpLevelName:           xp.levelName,
    xpCurrent:             xp.current,
    xpMax:                 xp.max,
    completedDaysThisWeek: getCompletedDaysThisWeek(completedDates),
  }
}

export const FALLBACK_DASHBOARD: DashboardData = {
  name:                  'Atleta',
  streak:                0,
  bestStreak:            0,
  weekComplete:          false,
  weight:                null,
  completionRate:        0,
  xpLevel:               1,
  xpLevelName:           'Novato',
  xpCurrent:             0,
  xpMax:                 XP_PER_LEVEL,
  completedDaysThisWeek: [],
}
