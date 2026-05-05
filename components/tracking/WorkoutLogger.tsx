'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLevelUp } from '@/context/LevelUpContext'
import type { LevelUpInfo } from '@/lib/xp'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutExercise {
  name:   string
  sets:   number // number of sets
  reps:   number // reps per set
  weight: number // kg — 0 means bodyweight
}

export interface WorkoutEntry {
  id:        string
  date:      string // ISO
  exercises: WorkoutExercise[]
  duration:  number // minutes
  completed: boolean
  notes:     string
}

interface Props {
  initialLogs: WorkoutEntry[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLANK_EXERCISE: WorkoutExercise = { name: '', sets: 3, reps: 10, weight: 0 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ─── ExerciseRow ──────────────────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: WorkoutExercise
  index:    number
  removable: boolean
  onChange: (i: number, field: keyof WorkoutExercise, value: string | number) => void
  onRemove: (i: number) => void
}

function ExerciseRow({ exercise, index, removable, onChange, onRemove }: ExerciseRowProps) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 space-y-3">

      {/* Name row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-muted font-bold w-5 shrink-0 tabular-nums select-none">
          {index + 1}
        </span>
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="Nombre del ejercicio"
          required
          className="flex-1 bg-bg-secondary border border-border-default focus:border-accent rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none transition-colors"
        />
        {removable && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Eliminar ejercicio"
            className="text-text-muted hover:text-red-400 transition-colors p-1 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Series / Reps / Peso */}
      <div className="grid grid-cols-3 gap-2 pl-7">
        {(
          [
            { field: 'sets'   as const, label: 'Series', min: 1, max: 20,  int: true },
            { field: 'reps'   as const, label: 'Reps',   min: 1, max: 200, int: true },
            { field: 'weight' as const, label: 'Peso kg', min: 0, max: 999, int: false },
          ]
        ).map(({ field, label, min, max, int: isInt }) => (
          <div key={field}>
            <label className="text-[10px] text-text-muted mb-1 block">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={isInt ? 1 : 0.5}
              value={exercise[field]}
              onChange={(e) => {
                const raw = e.target.value
                const val = isInt ? parseInt(raw, 10) : parseFloat(raw)
                onChange(index, field, isNaN(val) ? 0 : val)
              }}
              className="w-full bg-bg-secondary border border-border-default focus:border-accent rounded-lg px-2 py-2 text-sm text-text-primary outline-none transition-colors text-center tabular-nums"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── WorkoutCard (history row) ────────────────────────────────────────────────

function WorkoutCard({ log }: { log: WorkoutEntry }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="bg-bg-tertiary rounded-xl overflow-hidden">

      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary/60 transition-colors"
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            log.completed ? 'bg-green-400' : 'bg-border-default'
          }`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium">{formatDate(log.date)}</p>
          <p className="text-text-muted text-xs mt-0.5">
            {log.exercises.length} ejercicio{log.exercises.length !== 1 ? 's' : ''} · {log.duration} min
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {log.completed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20 font-semibold">
              Completado
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Detail panel — expandable */}
      {open && (
        <div className="px-4 pb-4 border-t border-border-default/40 space-y-1.5 pt-3">
          {/* Column headers */}
          <div className="grid grid-cols-3 text-[10px] text-text-muted uppercase tracking-widest mb-2 pl-4">
            <span>Ejercicio</span>
            <span className="text-center">Series × Reps</span>
            <span className="text-right">Peso</span>
          </div>

          {log.exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-3 items-center text-sm pl-4 py-1 rounded-lg hover:bg-bg-secondary/40">
              <span className="text-text-secondary truncate pr-2">{ex.name}</span>
              <span className="text-text-muted text-center tabular-nums">
                {ex.sets} × {ex.reps}
              </span>
              <span className="text-text-muted text-right tabular-nums">
                {ex.weight > 0 ? `${ex.weight} kg` : 'PC'}
              </span>
            </div>
          ))}

          {log.notes && (
            <p className="text-xs text-text-muted italic pl-4 pt-2 border-t border-border-default/30 mt-2">
              {log.notes}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

// ─── WorkoutLogger ────────────────────────────────────────────────────────────

export function WorkoutLogger({ initialLogs }: Props) {
  const router       = useRouter()
  const { triggerLevelUp } = useLevelUp()

  // History
  const [logs, setLogs] = useState<WorkoutEntry[]>(initialLogs)

  // Form
  const [exercises, setExercises] = useState<WorkoutExercise[]>([{ ...BLANK_EXERCISE }])
  const [duration,  setDuration]  = useState('')
  const [notes,     setNotes]     = useState('')
  const [completed, setCompleted] = useState(true)
  const [date,      setDate]      = useState(todayISO)
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'error'>('idle')
  const [error,     setError]     = useState<string | null>(null)

  // ── Exercise list mutations ──────────────────────────────────────────────────

  function addExercise() {
    setExercises((prev) => [...prev, { ...BLANK_EXERCISE }])
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateExercise(i: number, field: keyof WorkoutExercise, value: string | number) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)),
    )
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const dur = parseInt(duration, 10)
    if (isNaN(dur) || dur <= 0) {
      setError('Introduce una duración válida en minutos')
      return
    }

    if (exercises.some((ex) => !ex.name.trim())) {
      setError('Todos los ejercicios deben tener un nombre')
      return
    }

    setStatus('loading')

    const res = await fetch('/api/tracking/workout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ exercises, duration: dur, completed, notes, date }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(typeof body.error === 'string' ? body.error : 'Error al guardar')
      setStatus('error')
      return
    }

    const { log, levelUp } = (await res.json()) as { log: WorkoutEntry; levelUp?: LevelUpInfo | null }

    setLogs((prev) =>
      [log, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    )

    if (levelUp) triggerLevelUp(levelUp)

    // Reset form
    setExercises([{ ...BLANK_EXERCISE }])
    setDuration('')
    setNotes('')
    setCompleted(true)
    setDate(todayISO())
    setStatus('idle')
    router.refresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Form ─────────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary border border-border-default rounded-2xl p-5 space-y-5"
      >
        <h2 className="text-text-primary font-bold text-sm">Registrar entrenamiento</h2>

        {/* Exercise cards */}
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <ExerciseRow
              key={i}
              exercise={ex}
              index={i}
              removable={exercises.length > 1}
              onChange={updateExercise}
              onRemove={removeExercise}
            />
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="w-full py-2.5 rounded-xl border border-dashed border-border-default text-text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors"
          >
            + Añadir ejercicio
          </button>
        </div>

        {/* Duration + Date */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1" style={{ minWidth: '100px' }}>
            <label className="text-xs text-text-muted mb-1.5 block">Duración (min)</label>
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
              min="1"
              max="1440"
              required
              className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors"
            />
          </div>
          <div className="flex-1" style={{ minWidth: '140px' }}>
            <label className="text-xs text-text-muted mb-1.5 block">Fecha</label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sensaciones, PR, variaciones…"
            rows={2}
            className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors resize-none"
          />
        </div>

        {/* Completed toggle + Submit */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span className="text-text-secondary text-sm">Marcar como completado</span>
          </label>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-accent hover:bg-[#e03d15] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
          >
            {status === 'loading' ? 'Guardando…' : 'Guardar entrenamiento'}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
      </form>

      {/* ── History ───────────────────────────────────────────────────────────── */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <h2 className="text-text-primary font-bold text-sm mb-4">Historial de entrenamientos</h2>

        {logs.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            Sin entrenamientos aún — registra tu primera sesión.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <WorkoutCard key={log.id} log={log} />
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
