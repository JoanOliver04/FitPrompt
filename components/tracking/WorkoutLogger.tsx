'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLevelUp } from '@/context/LevelUpContext'
import { useToast } from '@/context/ToastContext'
import type { LevelUpInfo } from '@/lib/xp'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutSetDetail {
  weight: number
  reps:   number
}

export interface WorkoutExercise {
  name:        string
  sets:        number
  reps:        number
  weight:      number
  setDetails?: WorkoutSetDetail[]
}

export interface WorkoutEntry {
  id:        string
  date:      string
  exercises: WorkoutExercise[]
  duration:  number
  completed: boolean
  notes:     string
}

export interface RoutineExerciseData {
  id:          string
  name:        string
  sets:        number
  reps:        string
  restSeconds: number | null
  order:       number
}

export interface RoutineDayData {
  id:        string
  dayIndex:  number
  name:      string
  exercises: RoutineExerciseData[]
}

export interface RoutineSummary {
  id:   string
  name: string
  days: RoutineDayData[]
}

interface FormSet {
  weight: number
  reps:   number
}

interface FormExercise {
  name:       string
  targetReps: string
  sets:       FormSet[]
}

interface Props {
  initialLogs: WorkoutEntry[]
  routines?:   RoutineSummary[]
  // Pre-selected from URL
  preRoutineId?: string
  preDayId?:     string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split('T')[0] }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function blankSet(): FormSet { return { weight: 0, reps: 0 } }

function parseTargetReps(reps: string): number {
  const n = parseInt(reps.split('-')[0])
  return isNaN(n) ? 10 : n
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({
  index, set,
  onChange,
}: { index: number; set: FormSet; onChange: (s: FormSet) => void }) {
  return (
    <div className="grid grid-cols-[28px_1fr_1fr] gap-2 items-center">
      <span className="text-[10px] text-text-muted font-bold text-center tabular-nums select-none">
        {index + 1}
      </span>
      <div>
        <label className="text-[9px] text-text-muted block mb-0.5 text-center">Peso (kg)</label>
        <input
          type="number" min="0" max="999" step="0.5" inputMode="decimal"
          value={set.weight || ''}
          onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="w-full bg-bg-primary border border-border-default focus:border-accent rounded-lg px-2 py-1.5 text-sm text-text-primary outline-none transition-colors text-center tabular-nums"
        />
      </div>
      <div>
        <label className="text-[9px] text-text-muted block mb-0.5 text-center">Reps</label>
        <input
          type="number" min="1" max="200" inputMode="numeric"
          value={set.reps || ''}
          onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value) || 0 })}
          placeholder="0"
          className="w-full bg-bg-primary border border-border-default focus:border-accent rounded-lg px-2 py-1.5 text-sm text-text-primary outline-none transition-colors text-center tabular-nums"
        />
      </div>
    </div>
  )
}

// ─── RoutineExerciseCard ──────────────────────────────────────────────────────

function RoutineExerciseCard({
  exercise, onChange,
}: { exercise: FormExercise; onChange: (e: FormExercise) => void }) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-text-primary text-sm font-bold">{exercise.name}</p>
        <span className="text-[10px] text-text-muted bg-bg-secondary border border-border-default rounded-full px-2 py-0.5">
          {exercise.sets.length} series · {exercise.targetReps} reps objetivo
        </span>
      </div>
      <div className="space-y-2">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            onChange={(s) => {
              const sets = [...exercise.sets]
              sets[i] = s
              onChange({ ...exercise, sets })
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── ManualExerciseRow ────────────────────────────────────────────────────────

function ManualExerciseRow({
  exercise, index, removable, onChange, onRemove,
}: {
  exercise: WorkoutExercise
  index:    number
  removable: boolean
  onChange: (i: number, field: keyof WorkoutExercise, value: string | number) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-muted font-bold w-5 shrink-0 tabular-nums select-none">
          {index + 1}
        </span>
        <input
          type="text" value={exercise.name} required
          onChange={(e) => onChange(index, 'name', e.target.value)}
          placeholder="Nombre del ejercicio"
          className="flex-1 bg-bg-secondary border border-border-default focus:border-accent rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none transition-colors"
        />
        {removable && (
          <button type="button" onClick={() => onRemove(index)} className="text-text-muted hover:text-red-400 transition-colors p-1 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 pl-7">
        {([
          { field: 'sets'   as const, label: 'Series',  min: 1, max: 20,  int: true  },
          { field: 'reps'   as const, label: 'Reps',    min: 1, max: 200, int: true  },
          { field: 'weight' as const, label: 'Peso kg', min: 0, max: 999, int: false },
        ]).map(({ field, label, min, max, int: isInt }) => (
          <div key={field}>
            <label className="text-[10px] text-text-muted mb-1 block">{label}</label>
            <input
              type="number" inputMode="decimal" min={min} max={max} step={isInt ? 1 : 0.5}
              value={exercise[field]}
              onChange={(e) => {
                const v = isInt ? parseInt(e.target.value, 10) : parseFloat(e.target.value)
                onChange(index, field, isNaN(v) ? 0 : v)
              }}
              className="w-full bg-bg-secondary border border-border-default focus:border-accent rounded-lg px-2 py-2 text-sm text-text-primary outline-none transition-colors text-center tabular-nums"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── WorkoutCard (history) ────────────────────────────────────────────────────

function WorkoutCard({ log }: { log: WorkoutEntry }) {
  const [open, setOpen] = useState(false)

  return (
    <li className="bg-bg-tertiary rounded-xl overflow-hidden">
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary/60 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${log.completed ? 'bg-green-400' : 'bg-border-default'}`} />
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border-default/40 pt-3 space-y-2">
          {log.exercises.map((ex, i) => (
            <div key={i}>
              <p className="text-text-secondary text-sm font-medium mb-1">{ex.name}</p>
              {ex.setDetails && ex.setDetails.length > 0 ? (
                <div className="space-y-1 pl-2">
                  {ex.setDetails.map((s, j) => (
                    <div key={j} className="flex gap-4 text-xs text-text-muted tabular-nums">
                      <span className="w-4">S{j + 1}</span>
                      <span>{s.weight > 0 ? `${s.weight} kg` : 'PC'}</span>
                      <span>{s.reps} reps</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 text-xs text-text-muted pl-2 tabular-nums">
                  <span>{ex.sets} series</span>
                  <span>{ex.reps} reps</span>
                  <span>{ex.weight > 0 ? `${ex.weight} kg` : 'PC'}</span>
                </div>
              )}
            </div>
          ))}
          {log.notes && (
            <p className="text-xs text-text-muted italic pt-2 border-t border-border-default/30">{log.notes}</p>
          )}
        </div>
      )}
    </li>
  )
}

// ─── WorkoutLogger ────────────────────────────────────────────────────────────

export function WorkoutLogger({ initialLogs, routines = [], preRoutineId, preDayId }: Props) {
  const router             = useRouter()
  const { triggerLevelUp } = useLevelUp()
  const { addToast }       = useToast()

  const [logs, setLogs]   = useState<WorkoutEntry[]>(initialLogs)
  const [mode, setMode]   = useState<'manual' | 'routine'>(preRoutineId ? 'routine' : 'manual')

  // ── Manual form state ──────────────────────────────────────────────────────
  const BLANK: WorkoutExercise = { name: '', sets: 3, reps: 10, weight: 0 }
  const [manualExercises, setManualExercises] = useState<WorkoutExercise[]>([{ ...BLANK }])

  // ── Routine form state ─────────────────────────────────────────────────────
  const [selectedRoutineId, setSelectedRoutineId] = useState(preRoutineId ?? '')
  const [selectedDayId, setSelectedDayId]         = useState(preDayId ?? '')
  const [routineExercises, setRoutineExercises]    = useState<FormExercise[]>([])

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId)
  const selectedDay     = selectedRoutine?.days.find((d) => d.id === selectedDayId)

  function loadDay(dayId: string) {
    setSelectedDayId(dayId)
    const day = selectedRoutine?.days.find((d) => d.id === dayId)
    if (!day) return
    setRoutineExercises(
      day.exercises.map((ex) => ({
        name:       ex.name,
        targetReps: ex.reps,
        sets:       Array.from({ length: ex.sets }, () => blankSet()),
      })),
    )
  }

  function handleRoutineChange(id: string) {
    setSelectedRoutineId(id)
    setSelectedDayId('')
    setRoutineExercises([])
  }

  // ── Shared form state ──────────────────────────────────────────────────────
  const [duration,  setDuration]  = useState('')
  const [notes,     setNotes]     = useState('')
  const [completed, setCompleted] = useState(true)
  const [date,      setDate]      = useState(todayISO)
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'error'>('idle')
  const [error,     setError]     = useState<string | null>(null)

  // ── Manual exercise mutations ──────────────────────────────────────────────

  function addExercise() { setManualExercises((p) => [...p, { ...BLANK }]) }
  function removeExercise(i: number) { setManualExercises((p) => p.filter((_, idx) => idx !== i)) }
  function updateExercise(i: number, field: keyof WorkoutExercise, value: string | number) {
    setManualExercises((p) => p.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const dur = parseInt(duration, 10)
    if (isNaN(dur) || dur <= 0) { setError('Introduce una duración válida en minutos'); return }

    let exercises: WorkoutExercise[]

    if (mode === 'routine') {
      if (!selectedDayId) { setError('Selecciona un día de la rutina'); return }
      if (routineExercises.length === 0) { setError('La rutina no tiene ejercicios'); return }

      exercises = routineExercises.map((ex) => {
        const weights = ex.sets.map((s) => s.weight).filter((w) => w > 0)
        const repsList = ex.sets.map((s) => s.reps).filter((r) => r > 0)
        return {
          name:        ex.name,
          sets:        ex.sets.length,
          reps:        repsList.length ? Math.round(repsList.reduce((a, b) => a + b) / repsList.length) : parseTargetReps(ex.targetReps),
          weight:      weights.length ? Math.max(...weights) : 0,
          setDetails:  ex.sets,
        }
      })
    } else {
      if (manualExercises.some((ex) => !ex.name.trim())) { setError('Todos los ejercicios deben tener nombre'); return }
      exercises = manualExercises
    }

    setStatus('loading')

    const body: Record<string, unknown> = { exercises, duration: dur, completed, notes, date }
    if (mode === 'routine' && selectedRoutineId) {
      body.routineId    = selectedRoutineId
      body.routineDayId = selectedDayId
    }

    const res = await fetch('/api/tracking/workout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setError(typeof b.error === 'string' ? b.error : 'Error al guardar')
      setStatus('error')
      return
    }

    const { log, levelUp, xpGained, newBadge } = (await res.json()) as {
      log: WorkoutEntry; levelUp?: LevelUpInfo | null; xpGained?: number; newBadge?: { id: string; name: string; icon: string } | null
    }

    setLogs((prev) => [log, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

    if (levelUp)  triggerLevelUp(levelUp)
    if (xpGained) addToast({ variant: 'xp',   title: `+${xpGained} XP`, icon: '💪' })
    if (newBadge) addToast({ variant: 'badge', title: 'Logro desbloqueado', subtitle: newBadge.name, icon: newBadge.icon })

    // Reset
    setManualExercises([{ ...BLANK }])
    setDuration('')
    setNotes('')
    setCompleted(true)
    setDate(todayISO())
    if (mode === 'routine' && selectedDay) {
      setRoutineExercises(selectedDay.exercises.map((ex) => ({
        name: ex.name, targetReps: ex.reps,
        sets: Array.from({ length: ex.sets }, () => blankSet()),
      })))
    }
    setStatus('idle')
    router.refresh()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-default rounded-2xl p-5 space-y-5">

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-bg-tertiary rounded-xl">
          {(['manual', 'routine'] as const).map((m) => (
            <button
              key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {m === 'manual' ? 'Manual' : 'Desde rutina'}
            </button>
          ))}
        </div>

        {/* ── Routine mode ── */}
        {mode === 'routine' && (
          <div className="space-y-4">
            {routines.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-muted text-sm mb-3">No tienes rutinas guardadas todavía.</p>
                <a href="/routines" className="text-xs font-semibold text-[#FF471A] hover:underline">
                  Crear rutina desde el chat →
                </a>
              </div>
            ) : (
              <>
                {/* Routine selector */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Rutina</label>
                  <select
                    value={selectedRoutineId}
                    onChange={(e) => handleRoutineChange(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-colors"
                  >
                    <option value="">— Selecciona una rutina —</option>
                    {routines.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Day selector */}
                {selectedRoutine && (
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Día de entrenamiento</label>
                    <select
                      value={selectedDayId}
                      onChange={(e) => loadDay(e.target.value)}
                      className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-colors"
                    >
                      <option value="">— Selecciona el día —</option>
                      {selectedRoutine.days.map((d) => (
                        <option key={d.id} value={d.id}>Día {d.dayIndex + 1} — {d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Exercise set logger */}
                {routineExercises.length > 0 && (
                  <div className="space-y-3">
                    {routineExercises.map((ex, i) => (
                      <RoutineExerciseCard
                        key={i} exercise={ex}
                        onChange={(updated) => {
                          const list = [...routineExercises]
                          list[i] = updated
                          setRoutineExercises(list)
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Manual mode ── */}
        {mode === 'manual' && (
          <div className="space-y-3">
            {manualExercises.map((ex, i) => (
              <ManualExerciseRow
                key={i} exercise={ex} index={i}
                removable={manualExercises.length > 1}
                onChange={updateExercise}
                onRemove={removeExercise}
              />
            ))}
            <button
              type="button" onClick={addExercise}
              className="w-full py-2.5 rounded-xl border border-dashed border-border-default text-text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors"
            >
              + Añadir ejercicio
            </button>
          </div>
        )}

        {/* Duration + Date */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1" style={{ minWidth: '100px' }}>
            <label className="text-xs text-text-muted mb-1.5 block">Duración (min)</label>
            <input
              type="number" inputMode="numeric" value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45" min="1" max="1440" required
              className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors"
            />
          </div>
          <div className="flex-1" style={{ minWidth: '140px' }}>
            <label className="text-xs text-text-muted mb-1.5 block">Fecha</label>
            <input
              type="date" value={date} max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-text-muted mb-1.5 block">Notas (opcional)</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Sensaciones, PR, variaciones…" rows={2}
            className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors resize-none"
          />
        </div>

        {/* Completed + Submit */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 accent-accent rounded" />
            <span className="text-text-secondary text-sm">Marcar como completado</span>
          </label>
          <button
            type="submit" disabled={status === 'loading'}
            className="bg-accent hover:bg-[#e03d15] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
          >
            {status === 'loading' ? 'Guardando…' : 'Guardar entrenamiento'}
          </button>
        </div>

        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </form>

      {/* History */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <h2 className="text-text-primary font-bold text-sm mb-4">Historial de entrenamientos</h2>
        {logs.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">Sin entrenamientos — registra tu primera sesión.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => <WorkoutCard key={log.id} log={log} />)}
          </ul>
        )}
      </div>
    </div>
  )
}
