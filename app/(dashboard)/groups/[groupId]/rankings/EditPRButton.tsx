'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Mode = '1rep' | 'volume'

interface Props {
  exercise: string  // canonical name, e.g. "Press banca"
  mode:     Mode    // which ranking this PR feeds — UI changes per mode
  initial:  { weight: number; reps: number } | null
}

const MODE_TITLE: Record<Mode, string> = {
  '1rep':   'PR a 1 rep',
  'volume': 'Mejor set (peso × reps)',
}

const MODE_HINT: Record<Mode, string> = {
  '1rep':   'Indica el peso máximo que has levantado a una sola repetición. Esta marca solo afecta al ranking "PR a 1 rep".',
  'volume': 'Indica tu mejor serie de muchas repeticiones (peso + reps). Solo afecta al ranking "Más reps, menos peso".',
}

export default function EditPRButton({ exercise, mode, initial }: Props) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [weight, setWeight] = useState<string>(initial ? String(initial.weight) : '')
  const [reps, setReps]     = useState<string>(initial ? String(initial.reps)   : '')
  const [error, setError]   = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setWeight(initial ? String(initial.weight) : '')
    setReps(initial ? String(initial.reps) : (mode === '1rep' ? '1' : ''))
    setError(null)
    setOpen(true)
  }

  async function save() {
    setError(null)
    const w = Number(weight)
    if (!Number.isFinite(w) || w < 0 || w > 500) {
      setError('Peso entre 0 y 500 kg')
      return
    }

    let r = 1
    if (mode === 'volume') {
      r = parseInt(reps, 10)
      if (!Number.isInteger(r) || r < 2 || r > 50) {
        setError('Para "más reps", indica entre 2 y 50 repeticiones')
        return
      }
    }

    setSaving(true)
    const res = await fetch('/api/user/personal-records', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ exercise, mode, weight: w, reps: r }),
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-primary font-bold text-lg">{exercise}</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text-primary text-xl leading-none transition-colors"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <p className="text-[#FF471A] text-xs font-bold uppercase tracking-wider mb-3">
              {MODE_TITLE[mode]}
            </p>

            <p className="text-text-muted text-xs mb-4">{MODE_HINT[mode]}</p>

            {mode === '1rep' ? (
              <div>
                <label className="block text-text-muted text-xs font-medium mb-1.5">Peso (kg)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="120"
                  className={inputCls}
                  autoFocus
                />
              </div>
            ) : (
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
                    placeholder="80"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-text-muted text-xs font-medium mb-1.5">Reps</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="10"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

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
