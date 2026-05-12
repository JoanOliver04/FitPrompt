'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckInStatus {
  hasCheckIn: boolean
  checkIn: {
    id: string
    response: string
    aiSuggestions: string[] | null
  } | null
}

type ViewState = 'loading' | 'prompt' | 'done' | 'hidden'

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyCheckIn() {
  const [view, setView] = useState<ViewState>('loading')
  const [response, setResponse] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/checkin')
      .then((r) => r.json())
      .then((data: CheckInStatus) => {
        setView(data.hasCheckIn ? 'hidden' : 'prompt')
      })
      .catch(() => setView('hidden'))
  }, [])

  async function handleSubmit() {
    if (!response.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      const data = (await res.json()) as { suggestions: string[] }
      setSuggestions(data.suggestions ?? [])
      setView('done')
    } catch {
      setView('hidden')
    } finally {
      setSubmitting(false)
    }
  }

  if (view === 'loading' || view === 'hidden') return null

  return (
    <div className="mb-6 bg-bg-secondary border border-[#FF471A33] rounded-2xl p-5">
      {view === 'prompt' ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💬</span>
            <h2 className="text-text-primary font-bold text-lg">¿Cómo te ha ido esta semana?</h2>
          </div>
          <p className="text-text-secondary text-sm mb-3">
            Cuéntame — entrenamientos, energía, nutrición, lo que quieras.
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Esta semana he..."
            rows={3}
            className="w-full bg-bg-primary border border-border-default rounded-xl px-4 py-3 text-text-primary text-sm resize-none focus:outline-none focus:border-[#FF471A] placeholder:text-text-muted transition-colors"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || submitting}
              className="bg-[#FF471A] hover:bg-[#E03D16] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Guardando...' : 'Enviar'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h2 className="text-text-primary font-bold text-lg">Check-in registrado</h2>
            </div>
            <button
              onClick={() => setView('hidden')}
              className="text-[#666] hover:text-text-secondary text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
          {suggestions.length > 0 && (
            <>
              <p className="text-text-secondary text-sm mb-3">Sugerencias para esta semana:</p>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <span className="text-[#FF471A] font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
