import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { WeightTracker } from '@/components/tracking/WeightTracker'
import { WorkoutLogger } from '@/components/tracking/WorkoutLogger'
import type { WeightEntry } from '@/components/tracking/WeightTracker'
import type { WorkoutEntry, WorkoutExercise } from '@/components/tracking/WorkoutLogger'

export const metadata: Metadata = {
  title: 'Tracking — FitPrompt',
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
      select:  { id: true, date: true, exercises: true, duration: true, completed: true, notes: true },
    })
    return rows.map((r) => ({
      id:        r.id,
      date:      r.date.toISOString(),
      exercises: (Array.isArray(r.exercises) ? r.exercises : []) as WorkoutExercise[],
      duration:  r.duration,
      completed: r.completed,
      notes:     r.notes ?? '',
    }))
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackingPage() {
  const session = await getServerSession(authOptions)
  const userId  = session?.user?.id

  const [weightLogs, workoutLogs] = await Promise.all([
    userId ? getWeightLogs(userId)  : Promise.resolve<WeightEntry[]>([]),
    userId ? getWorkoutLogs(userId) : Promise.resolve<WorkoutEntry[]>([]),
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
        <WorkoutLogger initialLogs={workoutLogs} />
      </section>

      {/* Premium upsell */}
      <div className="bg-[#FF471A0D] border border-[#FF471A33] rounded-2xl p-5 flex items-center gap-4">
        <span className="text-3xl shrink-0" aria-hidden="true">📈</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-bold text-sm">Métricas avanzadas en Premium</p>
          <p className="text-text-secondary text-xs mt-0.5">
            % grasa corporal, IMC, evolución mensual y análisis detallado
          </p>
        </div>
      </div>

    </div>
  )
}
