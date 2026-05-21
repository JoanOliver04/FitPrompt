import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WeightTracker } from '@/components/tracking/WeightTracker'
import { WorkoutLogger } from '@/components/tracking/WorkoutLogger'
import PremiumGate from '@/components/ui/PremiumGate'
import type { WeightEntry } from '@/components/tracking/WeightTracker'
import type { WorkoutEntry, WorkoutExercise, RoutineSummary } from '@/components/tracking/WorkoutLogger'
import type { Plan } from '@/types'

export const metadata: Metadata = {
  title: 'Tracking — FitPrompt',
}

async function getRoutines(userId: string): Promise<RoutineSummary[]> {
  try {
    const routines = await db.routine.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
    })
    return routines as unknown as RoutineSummary[]
  } catch {
    return []
  }
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getWeightLogs(userId: string): Promise<WeightEntry[]> {
  try {
    const rows = await db.weightLog.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
      select:  { id: true, weight: true, date: true },
    })
    return rows.map((r) => ({ id: r.id, weight: r.weight, date: r.date.toISOString() }))
  } catch {
    return []
  }
}

async function getWorkoutLogs(userId: string): Promise<WorkoutEntry[]> {
  try {
    const rows = await db.workoutLog.findMany({
      where:   { userId },
      orderBy: { date: 'desc' },
      take:    50,
      select:  {
        id: true, date: true, duration: true, completed: true, notes: true,
        exercises: {
          orderBy: { order: 'asc' },
          select:  { name: true, sets: true, reps: true, weight: true },
        },
      },
    })
    return rows.map((r) => ({
      id:        r.id,
      date:      r.date.toISOString(),
      exercises: r.exercises as WorkoutExercise[],
      duration:  r.duration,
      completed: r.completed,
      notes:     r.notes ?? '',
    }))
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ routineId?: string; dayId?: string }>
}) {
  const session   = await getServerSession(authOptions)
  const userId    = session?.user?.id
  const plan      = (session?.user as { plan?: Plan } | undefined)?.plan ?? 'free'
  const isPremium = plan === 'premium'
  const sp        = await searchParams

  const [weightLogs, workoutLogs, routines] = await Promise.all([
    userId ? getWeightLogs(userId)  : Promise.resolve<WeightEntry[]>([]),
    userId ? getWorkoutLogs(userId) : Promise.resolve<WorkoutEntry[]>([]),
    userId ? getRoutines(userId)    : Promise.resolve<RoutineSummary[]>([]),
  ])

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-fade-in space-y-10">

      {/* Weight section */}
      <section>
        <div className="mb-5">
          <h1 className="text-3xl font-black text-text-primary">Tracking</h1>
          <p className="text-text-secondary text-sm mt-1">Registra tu progreso y sigue tu evolución</p>
        </div>

        <div className="mb-3">
          <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
            <span aria-hidden="true">⚖️</span> Peso corporal
          </h2>
        </div>
        <WeightTracker initialLogs={weightLogs} />
      </section>

      {/* Workout section */}
      <section>
        <div className="mb-3">
          <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
            <span aria-hidden="true">💪</span> Entrenamientos
          </h2>
        </div>
        <WorkoutLogger
          initialLogs={workoutLogs}
          routines={routines}
          preRoutineId={sp.routineId}
          preDayId={sp.dayId}
        />
      </section>

      {/* Advanced metrics — locked for free, visible for premium */}
      <section>
        <div className="mb-3">
          <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
            <span aria-hidden="true">📈</span> Métricas avanzadas
          </h2>
        </div>
        {isPremium ? (
          <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 text-center">
            <p className="text-text-muted text-sm">Próximamente — análisis detallado de progreso.</p>
          </div>
        ) : (
          <PremiumGate
            feature="Métricas avanzadas"
            description="% grasa corporal, IMC, evolución mensual y análisis detallado de tu progreso."
          />
        )}
      </section>

    </div>
  )
}
