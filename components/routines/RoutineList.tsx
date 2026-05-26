'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RoutineDay {
  id:       string
  dayIndex: number
  name:     string
  _count:   { exercises: number }
}

interface Routine {
  id:        string
  name:      string
  createdAt: string
  days:      RoutineDay[]
}

export default function RoutineList({ routines: initial }: { routines: Routine[] }) {
  const router = useRouter()
  const [routines, setRoutines] = useState(initial)
  const [editing, setEditing]   = useState<string | null>(null)
  const [draft, setDraft]       = useState('')
  const [saving, setSaving]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(r: Routine, e: React.MouseEvent) {
    e.preventDefault()
    setEditing(r.id)
    setDraft(r.name)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commitEdit(id: string) {
    const name = draft.trim()
    if (!name || name === routines.find(r => r.id === id)?.name) {
      setEditing(null)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/routines/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name }),
      })
      if (res.ok) {
        setRoutines(prev => prev.map(r => r.id === id ? { ...r, name } : r))
        router.refresh()
      }
    } finally {
      setSaving(false)
      setEditing(null)
    }
  }

  return (
    <div className="space-y-4">
      {routines.map((routine) => (
        <div key={routine.id} className="relative group">
          <Link
            href={`/routines/${routine.id}`}
            className="block bg-bg-secondary border border-border-default hover:border-[#FF471A44] rounded-2xl p-5 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {editing === routine.id ? (
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={() => commitEdit(routine.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit(routine.id) }
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    onClick={e => e.preventDefault()}
                    disabled={saving}
                    maxLength={80}
                    className="w-full bg-bg-tertiary border border-[#FF471A66] rounded-lg px-3 py-1 text-text-primary font-bold text-base outline-none"
                  />
                ) : (
                  <h2 className="text-text-primary font-bold text-base group-hover:text-[#FF471A] transition-colors truncate">
                    {routine.name}
                  </h2>
                )}
                <p className="text-text-muted text-xs mt-1">
                  {new Date(routine.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={e => startEdit(routine, e)}
                  title="Renombrar rutina"
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-bg-tertiary hover:bg-[#FF471A20] text-text-muted hover:text-[#FF471A] transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <span className="text-text-muted group-hover:text-text-secondary transition-colors text-lg">›</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {routine.days.map((day) => (
                <div key={day.id} className="bg-bg-tertiary rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Día {day.dayIndex + 1}</span>
                  <span className="text-text-muted ml-1">· {day.name}</span>
                  <span className="text-text-muted ml-1.5">({day._count.exercises} ejercicios)</span>
                </div>
              ))}
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
