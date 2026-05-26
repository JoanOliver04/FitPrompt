'use client'

import Link from 'next/link'
import type { WeekDayWorkout } from '@/lib/dashboard'

interface Props {
  todayWorkout:  WeekDayWorkout | null
  totalWorkouts: number
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function TodayCard({ todayWorkout, totalWorkouts }: Props) {

  /* ── Trained today ──────────────────────────────────────── */
  if (todayWorkout) {
    const shown = todayWorkout.exercises.slice(0, 4)
    const extra = todayWorkout.exercises.length - shown.length

    return (
      <div className="mb-6 rounded-2xl border border-[#22c55e]/25 bg-bg-secondary overflow-hidden animate-enter">
        <div className="flex items-center gap-3 px-5 py-4 bg-[#22c55e]/5 border-b border-[#22c55e]/15">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center text-lg shrink-0">
            ✅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-black text-sm">¡Entrenamiento completado hoy!</p>
            <p className="text-text-muted text-xs mt-0.5">
              {todayWorkout.duration} min · {todayWorkout.exercises.length} ejercicio{todayWorkout.exercises.length !== 1 ? 's' : ''}
              {totalWorkouts > 0 && (
                <span className="ml-2 text-text-subtle">· {totalWorkouts} en total</span>
              )}
            </p>
          </div>
          <span className="text-2xl shrink-0">💪</span>
        </div>

        {shown.length > 0 && (
          <div className="px-5 py-3 space-y-1.5">
            {shown.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-0.5">
                <span className="text-[#FF471A] font-black w-4 shrink-0">{i + 1}</span>
                <span className="text-text-secondary flex-1 min-w-0 truncate">{ex.name}</span>
                <span className="text-text-muted tabular-nums shrink-0 font-medium">{ex.sets}×{ex.reps}</span>
                {ex.weight > 0 && (
                  <span className="text-text-subtle tabular-nums shrink-0 w-14 text-right">{ex.weight} kg</span>
                )}
              </div>
            ))}
            {extra > 0 && (
              <p className="text-text-muted text-xs pl-4">+{extra} más…</p>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── Not trained today ──────────────────────────────────── */
  return (
    <div className="mb-6 rounded-2xl border border-border-default bg-bg-secondary animate-enter">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FF471A]/10 border border-[#FF471A]/20 flex items-center justify-center text-2xl shrink-0">
          🏋️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-black text-sm">{greeting()} — ¿Entrenamos hoy?</p>
          <p className="text-text-muted text-xs mt-0.5">
            {totalWorkouts > 0
              ? `${totalWorkouts} entreno${totalWorkouts !== 1 ? 's' : ''} registrado${totalWorkouts !== 1 ? 's' : ''}. ¡A por otro!`
              : 'Registra tu primera sesión y empieza a progresar'}
          </p>
        </div>
        <Link
          href="/tracking"
          className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0"
        >
          Entrenar →
        </Link>
      </div>
    </div>
  )
}
