'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

// Dates are ISO strings after crossing the server→client boundary
export interface WeightEntry {
  id:     string
  weight: number
  date:   string
}

interface Props {
  initialLogs: WeightEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  signed = false,
}: {
  label:   string
  value:   number | null
  signed?: boolean
}) {
  const formatted =
    value !== null
      ? `${signed && value > 0 ? '+' : ''}${value.toFixed(1)} kg`
      : '—'

  const color =
    signed && value !== null
      ? value < 0
        ? 'text-green-400'
        : value > 0
        ? 'text-accent'
        : 'text-text-primary'
      : 'text-text-primary'

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-4">
      <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-xl font-black tabular-nums ${color}`}>{formatted}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeightTracker({ initialLogs }: Props) {
  const router = useRouter()

  const [logs,   setLogs]   = useState<WeightEntry[]>(initialLogs)
  const [weight, setWeight] = useState('')
  const [date,   setDate]   = useState(todayISO)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error,  setError]  = useState<string | null>(null)

  // Stats — logs are always ordered desc so [0] = most recent, [last] = oldest
  const current = logs[0]?.weight ?? null
  const initial = logs[logs.length - 1]?.weight ?? null
  const diff =
    current !== null && initial !== null && logs.length > 1
      ? Math.round((current - initial) * 10) / 10
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0 || w > 500) {
      setError('Introduce un peso válido (entre 1 y 500 kg)')
      return
    }

    setStatus('loading')

    const res = await fetch('/api/tracking/weight', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ weight: w, date }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(typeof body.error === 'string' ? body.error : 'Error al guardar')
      setStatus('error')
      return
    }

    const { log } = (await res.json()) as { log: WeightEntry }

    // Insert and re-sort to keep desc order by date
    setLogs((prev) =>
      [log, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    )
    setWeight('')
    setDate(todayISO())
    setStatus('idle')
    router.refresh()
  }

  return (
    <div className="space-y-5">

      {/* Stats — only shown once at least one entry exists */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Peso actual"  value={current} />
          <StatCard label="Peso inicial" value={initial} />
          <StatCard label="Diferencia"   value={diff} signed />
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary border border-border-default rounded-2xl p-5"
      >
        <h2 className="text-text-primary font-bold text-sm mb-4">Registrar peso</h2>

        <div className="flex gap-3 items-end flex-wrap">
          {/* Weight input */}
          <div className="flex-1" style={{ minWidth: '110px' }}>
            <label className="text-xs text-text-muted mb-1.5 block">Peso (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70.5"
              required
              className="w-full bg-bg-tertiary border border-border-default focus:border-accent rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors"
            />
          </div>

          {/* Date input */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={!weight.trim() || status === 'loading'}
            className="bg-accent hover:bg-[#e03d15] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shrink-0"
          >
            {status === 'loading' ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-400 mt-3">
            {error}
          </p>
        )}
      </form>

      {/* History list */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <h2 className="text-text-primary font-bold text-sm mb-4">Historial</h2>

        {logs.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            Sin registros aún — añade tu primer peso arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log, i) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 bg-bg-tertiary"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      i === 0 ? 'bg-accent' : 'bg-border-default'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-text-secondary text-sm">{formatDate(log.date)}</span>
                  {i === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">
                      actual
                    </span>
                  )}
                </div>

                <span className="text-text-primary font-bold text-sm tabular-nums shrink-0">
                  {log.weight.toFixed(1)} kg
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
