'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseRoutineFromMarkdown, type ParsedRoutine, type ParsedExercise } from '@/lib/routineParser'

interface Props {
  content: string
}

export default function SaveRoutineButton({ content }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [routine, setRoutine] = useState<ParsedRoutine | null>(null)
  const [name, setName]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function handleOpen() {
    const parsed = parseRoutineFromMarkdown(content)
    if (!parsed) {
      setError('No se detectó una rutina estructurada en este mensaje.')
      return
    }
    setRoutine(parsed)
    setName(parsed.name)
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    if (!routine || !name.trim()) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/routines', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...routine, name: name.trim() }),
    })

    if (!res.ok) {
      setError('Error al guardar la rutina.')
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    setOpen(false)
    router.refresh()
  }

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-medium mt-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Rutina guardada en /rutinas
      </span>
    )
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF471A] hover:text-[#e03d15] border border-[#FF471A33] hover:border-[#FF471A66] rounded-lg px-3 py-1.5 transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Guardar como rutina
      </button>

      {error && !open && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}

      {open && routine && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-lg p-6 animate-enter max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-bold text-base">Guardar rutina</h3>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
            </div>

            {/* Routine name */}
            <div className="mb-5">
              <label className="text-text-muted text-xs font-medium block mb-1.5">Nombre de la rutina</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-[#FF471A] transition-colors"
              />
            </div>

            {/* Days preview */}
            <div className="space-y-3 mb-5">
              {routine.days.map((day, i) => (
                <div key={i} className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-text-primary text-sm font-bold mb-2">
                    Día {day.dayIndex + 1} — {day.name}
                  </p>
                  {day.exercises.length === 0 ? (
                    <p className="text-text-muted text-xs">Sin ejercicios detectados</p>
                  ) : (
                    <div className="space-y-1">
                      {day.exercises.map((ex, j) => (
                        <ExercisePreviewRow key={j} ex={ex} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FF471A] hover:bg-[#E03D16] disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar rutina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ExercisePreviewRow({ ex }: { ex: ParsedExercise }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-secondary truncate mr-2">{ex.name}</span>
      <span className="text-text-muted shrink-0 tabular-nums">{ex.sets} × {ex.reps}</span>
    </div>
  )
}
