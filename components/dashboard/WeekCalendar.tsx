'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import type { WeekDayWorkout, WeekDayExercise } from '@/lib/dashboard'

interface Props {
  weekWorkouts: WeekDayWorkout[]
}

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DAY_NAMES   = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function ExerciseRow({ index, ex }: { index: number; ex: WeekDayExercise }) {
  const details  = ex.setDetails?.filter(s => s.reps > 0) ?? []
  const varyWeight = details.length > 1 && new Set(details.map(s => s.weight)).size > 1

  return (
    <div className="bg-bg-tertiary rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[#FF471A] font-black text-sm w-5 shrink-0">{index + 1}</span>
        <span className="text-text-primary font-medium text-sm flex-1 min-w-0">{ex.name}</span>
        {!varyWeight && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-bg-secondary border border-border-default rounded-lg px-2 py-0.5 text-text-secondary text-xs font-semibold tabular-nums">
              {details.length > 0 ? details.length : ex.sets}×{details.length > 0 ? details[0].reps : ex.reps}
            </span>
            {(details[0]?.weight ?? ex.weight) > 0 && (
              <span className="text-text-muted text-xs tabular-nums">
                {details[0]?.weight ?? ex.weight} kg
              </span>
            )}
          </div>
        )}
      </div>

      {varyWeight && (
        <div className="mt-2 pl-8 space-y-1">
          {details.map((s, j) => (
            <div key={j} className="flex items-center gap-3 text-xs tabular-nums">
              <span className="text-text-subtle w-5">S{j + 1}</span>
              <span className="text-text-secondary">{s.reps} reps</span>
              <span className="text-text-muted">
                {s.weight > 0 ? `${s.weight} kg` : 'Peso corporal'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WeekCalendar({ weekWorkouts }: Props) {
  const [selected, setSelected] = useState<WeekDayWorkout | null>(null)

  const rawDay    = new Date().getDay()
  const todayIdx  = rawDay === 0 ? 6 : rawDay - 1

  const byDay = new Map(weekWorkouts.map(w => [w.dayIndex, w]))

  return (
    <>
      <Card className="mb-8">
        <CardHeader title="Semana actual" />
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAY_LETTERS.map((letter, i) => {
              const isToday = i === todayIdx
              const workout = byDay.get(i)
              const isDone  = !!workout

              return (
                <div key={letter} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-text-muted font-semibold uppercase">{letter}</span>
                  <button
                    type="button"
                    disabled={!isDone}
                    onClick={() => workout && setSelected(workout)}
                    className={[
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
                      isDone
                        ? isToday
                          ? 'bg-[#22c55e] text-white ring-2 ring-[#22c55e44] ring-offset-2 ring-offset-bg-secondary cursor-pointer hover:scale-110'
                          : 'bg-[#1DB95420] text-[#1DB954] border border-[#1DB95440] cursor-pointer hover:bg-[#1DB95435] hover:scale-110 hover:shadow-lg'
                        : isToday
                          ? 'bg-[#FF471A] text-white ring-2 ring-[#FF471A44] ring-offset-2 ring-offset-bg-secondary'
                          : 'bg-bg-tertiary text-text-subtle cursor-default',
                    ].join(' ')}
                    title={isDone ? `Ver resumen — ${DAY_NAMES[i]}` : undefined}
                  >
                    {isDone ? '✓' : i + 1}
                  </button>
                </div>
              )
            })}
          </div>

          {weekWorkouts.length > 0 && (
            <p className="text-text-muted text-[11px] text-center mt-4">
              Pulsa en un día completado para ver el resumen
            </p>
          )}
        </CardContent>
      </Card>

      {/* Workout detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-lg bg-bg-secondary rounded-t-3xl sm:rounded-2xl border border-border-default overflow-hidden animate-enter">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-default">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="text-[#22c55e] text-xs font-bold uppercase tracking-wide">Completado</span>
                </div>
                <h3 className="text-text-primary font-black text-xl">{DAY_NAMES[selected.dayIndex]}</h3>
                <p className="text-text-muted text-sm mt-0.5">
                  {selected.duration} min
                  {selected.exercises.length > 0 && ` · ${selected.exercises.length} ejercicio${selected.exercises.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg-tertiary hover:bg-border-default text-text-muted hover:text-text-primary transition-colors text-sm shrink-0 mt-1"
              >
                ✕
              </button>
            </div>

            {/* Exercise list */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-2">
              {selected.exercises.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-6">Sin ejercicios registrados</p>
              ) : (
                selected.exercises.map((ex, i) => (
                  <ExerciseRow key={i} index={i} ex={ex} />
                ))
              )}

              {selected.notes && (
                <div className="mt-3 px-4 py-3 bg-bg-tertiary rounded-xl">
                  <p className="text-text-muted text-xs leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-3 rounded-xl bg-bg-tertiary hover:bg-border-default text-text-secondary text-sm font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
