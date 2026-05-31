'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  exercise: string  // canonical name, e.g. "Press banca"
  initial: { weight: number; reps: number } | null
}

export default function EditPRButton({ exercise, initial }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [weight, setWeight]   = useState<string>(initial ? String(initial.weight) : '')
  const [reps, setReps]       = useState<string>(initial ? String(initial.reps)   : '')
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setWeight(initial ? String(initial.weight) : '')
    setReps(initial ? String(initial.reps) : '')
    setError(null)
    setOpen(true)
  }

  async function save() {
    setError(null)
    const w = Number(weight)
    const r = parseInt(reps, 10)
    if (!Number.isFinite(w) || w < 0 || w > 500) {
      setError('Peso entre 0 y 500 kg')
      return
    }
    if (!Number.isInteger(r) || r < 1 || r > 50) {
      setError('Reps entre 1 y 50')
      return
    }

    setSaving(true)
    const res = await fetch('/api/user/personal-records', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ exercise, weight: w, reps: r }),
    })
    setSaving(false)

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string; issues?: { message: string }[] }
        | null
      setError(data?.issues?.[0]?.message ?? data?.error ?? 'No se pudo guardar')
      return
    }

    setOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
        {initial ? 'Actualizar mi marca' : 'Registrar mi marca'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-sm p-6 animate-enter">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-bold text-lg">{exercise}</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text-primary text-xl leading-none transition-colors"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <p className="text-text-muted text-xs mb-4">
              Registra tu mejor serie. Si pones peso corporal, escribe 0 kg.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted text-xs font-medium mb-1.5">Peso (kg)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="100"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-text-muted text-xs font-medium mb-1.5">Reps</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="5"
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-3" role="alert">{error}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving || isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#FF471A] hover:bg-[#e03d15] disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {saving || isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inputCls = 'w-full bg-bg-primary border border-border-default rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-[#FF471A] transition-colors'
