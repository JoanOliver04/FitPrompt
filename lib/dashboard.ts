import { db } from '@/lib/db'
import { resolveStreak } from '@/lib/streak'
import { getXP, XP_PER_LEVEL } from '@/lib/xp'

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
  // Progress stats
  totalWorkouts:         number
  activeDays:            number
  avgDuration:           number | null // minutes
  weightInitial:         number | null
}


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


export async function getDashboardData(
  userId:   string,
  userName: string,
): Promise<DashboardData> {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const [latestWeight, workoutLogs, profile, oldestWeight, allWorkouts, xp] = await Promise.all([
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
    db.userProfile.findUnique({
      where:  { userId },
      select: { daysPerWeek: true, weight: true },
    }),
    db.weightLog.findFirst({
      where:   { userId },
      orderBy: { date: 'asc' },
      select:  { weight: true },
    }),
    db.workoutLog.findMany({
      where:  { userId, completed: true },
      select: { date: true, duration: true },
    }),
    getXP(userId),
  ])

  const daysPerWeek    = profile?.daysPerWeek ?? 4
  const completedDates = workoutLogs.map(l => l.date)
  const streakData     = await resolveStreak(userId, daysPerWeek)

  // Prefer logged weight over profile weight (onboarding value)
  const weight = latestWeight?.weight ?? profile?.weight ?? null

  // Progress stats (all-time)
  const totalWorkouts = allWorkouts.length
  const activeDays    = new Set(allWorkouts.map(w => w.date.toISOString().split('T')[0])).size
  const avgDuration   = totalWorkouts > 0
    ? Math.round(allWorkouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts)
    : null

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
    totalWorkouts,
    activeDays,
    avgDuration,
    weightInitial:         oldestWeight?.weight ?? null,
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
  totalWorkouts:         0,
  activeDays:            0,
  avgDuration:           null,
  weightInitial:         null,
}
