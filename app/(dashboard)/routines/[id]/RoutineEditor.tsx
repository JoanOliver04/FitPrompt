'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExerciseInput {
  id?:         string  // present on existing rows, absent on new ones
  name:        string
  sets:        number
  reps:        string
  restSeconds: number | null
  order:       number
}

interface DayInput {
  id?:       string
  dayIndex:  number
  name:      string
  exercises: ExerciseInput[]
}

export interface RoutineEditorInitial {
  id:   string
  name: string
  days: DayInput[]
}

interface Props {
  routineId: string
  initial:   RoutineEditorInitial
}

export default function RoutineEditor({ routineId, initial }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(initial.name)
  const [days, setDays]       = useState<DayInput[]>(initial.days)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function cancel() {
    setName(initial.name)
    setDays(initial.days)
    setError(null)
    setEditing(false)
  }

  function addDay() {
    const nextIdx = days.length
    setDays([...days, { dayIndex: nextIdx, name: `Día ${nextIdx + 1}`, exercises: [] }])
  }

  function removeDay(idx: number) {
    const next = days
      .filter((_, i) => i !== idx)
      .map((d, i) => ({ ...d, dayIndex: i }))   // re-index
    setDays(next)
  }

  function patchDay(idx: number, patch: Partial<DayInput>) {
    setDays(days.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  function addExercise(dayIdx: number) {
    setDays(days.map((d, i) => {
      if (i !== dayIdx) return d
      const order = d.exercises.length
      return {
        ...d,
        exercises: [
          ...d.exercises,
          { name: '', sets: 3, reps: '8-10', restSeconds: 60, order },
        ],
      }
    }))
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDays(days.map((d, i) => {
      if (i !== dayIdx) return d
      const exercises = d.exercises
        .filter((_, j) => j !== exIdx)
        .map((e, j) => ({ ...e, order: j }))
      return { ...d, exercises }
    }))
  }

  function patchExercise(dayIdx: number, exIdx: number, patch: Partial<ExerciseInput>) {
    setDays(days.map((d, i) => {
      if (i !== dayIdx) return d
      return {
        ...d,
        exercises: d.exercises.map((e, j) => (j === exIdx ? { ...e, ...patch } : e)),
      }
    }))
  }

  async function save() {
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 80) {
      setError('El nombre de la rutina debe tener entre 1 y 80 caracteres.')
      return
    }
    if (days.length === 0) {
      setError('La rutina necesita al menos un día.')
      return
    }

    // Strip empty exercises so the API doesn't reject the payload.
    const normalized = days.map((d, i) => ({
      dayIndex: i,
      name:     d.name.trim() || `Día ${i + 1}`,
      exercises: d.exercises
        .filter((ex) => ex.name.trim().length > 0)
        .map((ex, j) => ({
          name:        ex.name.trim(),
          sets:        clampInt(ex.sets, 1, 20, 3),
          reps:        (ex.reps || '8-10').toString().slice(0, 20),
          restSeconds: ex.restSeconds === null
            ? null
            : clampInt(ex.restSeconds, 0, 600, 60),
          order:       j,
        })),
    }))

    setSaving(true)
    const res = await fetch(`/api/routines/${routineId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: trimmedName, days: normalized }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string; issues?: { message: string }[] }
        | null
      setError(data?.issues?.[0]?.message ?? data?.error ?? 'No se pudo guardar la rutina.')
      return
    }

    setEditing(false)
    startTransition(() => router.refresh())
  }

  // ── Read-only view ─────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <>
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-text-primary truncate">{initial.name}</h1>
            <p className="text-text-muted text-xs mt-1">
              {initial.days.length} día{initial.days.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/routines/${routineId}/pdf`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border-default hover:border-[#FF471A66] hover:text-[#FF471A] text-text-secondary px-3.5 py-2 rounded-xl transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white px-3.5 py-2 rounded-xl transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
              Editar
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {initial.days.map((day) => (
            <div key={day.id ?? day.dayIndex} className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <div>
                  <span className="text-[#FF471A] text-xs font-bold uppercase tracking-wider">
                    Día {day.dayIndex + 1}
                  </span>
                  <h2 className="text-text-primary font-bold text-base mt-0.5">{day.name}</h2>
                </div>
                <Link
                  href={`/tracking?routineId=${routineId}&dayId=${day.id ?? ''}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FF471A] hover:bg-[#E03D16] text-white px-3.5 py-2 rounded-xl transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Entrenar
                </Link>
              </div>

              {day.exercises.length === 0 ? (
                <p className="px-5 py-4 text-text-muted text-sm">Sin ejercicios.</p>
              ) : (
                <div className="divide-y divide-border-default">
                  <div className="grid grid-cols-12 px-5 py-2 text-[10px] text-text-muted uppercase tracking-wider">
                    <span className="col-span-6">Ejercicio</span>
                    <span className="col-span-2 text-center">Series</span>
                    <span className="col-span-2 text-center">Reps</span>
                    <span className="col-span-2 text-right">Descanso</span>
                  </div>
                  {day.exercises.map((ex) => (
                    <div key={ex.id ?? ex.order} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-bg-tertiary/40 transition-colors">
                      <span className="col-span-6 text-text-primary text-sm font-medium truncate pr-2">{ex.name}</span>
                      <span className="col-span-2 text-text-secondary text-sm text-center tabular-nums">{ex.sets}</span>
                      <span className="col-span-2 text-text-secondary text-sm text-center tabular-nums">{ex.reps}</span>
                      <span className="col-span-2 text-text-muted text-xs text-right">
                        {ex.restSeconds ? `${ex.restSeconds}s` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Nombre de la rutina
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full bg-bg-secondary border border-border-default rounded-xl px-4 py-3 text-text-primary text-base font-bold focus:outline-none focus:border-[#FF471A] transition-colors"
        />
      </div>

      <div className="space-y-5 mb-6">
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[#FF471A] text-xs font-bold uppercase tracking-wider">
                  Día {dayIdx + 1}
                </span>
                <input
                  type="text"
                  value={day.name}
                  onChange={(e) => patchDay(dayIdx, { name: e.target.value })}
                  maxLength={60}
                  placeholder={`Día ${dayIdx + 1}`}
                  className="w-full bg-transparent text-text-primary font-bold text-base mt-0.5 focus:outline-none border-b border-transparent focus:border-[#FF471A33]"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDay(dayIdx)}
                className="shrink-0 text-text-muted hover:text-red-400 text-xs font-semibold px-2 py-1 transition-colors"
              >
                Eliminar día
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {day.exercises.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-2">Sin ejercicios todavía.</p>
              ) : (
                day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => patchExercise(dayIdx, exIdx, { name: e.target.value })}
                      placeholder="Ejercicio"
                      maxLength={80}
                      className="col-span-5 bg-bg-primary border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-sm focus:outline-none focus:border-[#FF471A] transition-colors"
                    />
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => patchExercise(dayIdx, exIdx, { sets: parseInt(e.target.value) || 1 })}
                      min={1} max={20}
                      placeholder="Series"
                      className="col-span-2 bg-bg-primary border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-sm text-center tabular-nums focus:outline-none focus:border-[#FF471A] transition-colors"
                    />
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => patchExercise(dayIdx, exIdx, { reps: e.target.value })}
                      placeholder="Reps"
                      maxLength={20}
                      className="col-span-2 bg-bg-primary border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-sm text-center tabular-nums focus:outline-none focus:border-[#FF471A] transition-colors"
                    />
                    <input
                      type="number"
                      value={ex.restSeconds ?? ''}
                      onChange={(e) => patchExercise(dayIdx, exIdx, {
                        restSeconds: e.target.value === '' ? null : parseInt(e.target.value),
                      })}
                      min={0} max={600}
                      placeholder="Desc s"
                      className="col-span-2 bg-bg-primary border border-border-default rounded-lg px-2.5 py-2 text-text-primary text-sm text-center tabular-nums focus:outline-none focus:border-[#FF471A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(dayIdx, exIdx)}
                      className="col-span-1 text-text-muted hover:text-red-400 text-lg leading-none transition-colors"
                      aria-label="Eliminar ejercicio"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => addExercise(dayIdx)}
                className="mt-1 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#FF471A] hover:text-[#e03d15] border border-dashed border-[#FF471A33] hover:border-[#FF471A66] rounded-lg py-2 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Añadir ejercicio
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addDay}
          className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-border-default border border-dashed border-border-default rounded-2xl py-4 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Añadir día
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs mb-3" role="alert">{error}</p>
      )}

      <div className="flex gap-3 sticky bottom-4 bg-bg-primary/80 backdrop-blur-md p-3 rounded-2xl border border-border-default">
        <button
          type="button"
          onClick={cancel}
          disabled={saving || isPending}
          className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || isPending}
          className="flex-1 py-2.5 rounded-xl bg-[#FF471A] hover:bg-[#e03d15] disabled:opacity-50 text-white text-sm font-bold transition-colors"
        >
          {saving || isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </>
  )
}

function clampInt(value: number | null | undefined, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, n))
}
