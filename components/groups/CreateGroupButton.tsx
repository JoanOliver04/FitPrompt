'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Props {
  isPremium: boolean
}

export default function CreateGroupButton({ isPremium }: Props) {
  const [open, setOpen]           = useState(false)
  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [upgradeOpen, setUpgrade] = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const router                    = useRouter()

  // ── Free plan: locked button + upgrade modal ──────────────────────────────
  if (!isPremium) {
    return (
      <>
        <button
          type="button"
          onClick={() => setUpgrade(true)}
          className="flex items-center gap-1.5 bg-bg-tertiary border border-border-default text-text-muted px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:border-[#FF471A33] hover:text-text-secondary"
          title="Función Premium"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Crear grupo
        </button>

        {upgradeOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setUpgrade(false)}
          >
            <div
              className="bg-[#161616] border border-[#2a2a2a] rounded-2xl w-full max-w-xs shadow-2xl p-6 text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] mx-auto flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF471A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>

              <div>
                <p className="text-text-primary font-black text-base">Grupos sociales</p>
                <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
                  Crea grupos de entrenamiento, compite con amigos y lleva un ranking compartido.
                  Disponible en el plan Premium.
                </p>
              </div>

              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 bg-[#FF471A] hover:bg-[#e03d15] text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.97]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Ver planes
              </Link>

              <button
                type="button"
                onClick={() => setUpgrade(false)}
                className="text-text-muted text-xs hover:text-text-secondary transition-colors w-full"
              >
                Ahora no
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Premium plan: normal create flow ─────────────────────────────────────

  const openModal = () => {
    setOpen(true)
    setError(null)
    setName('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const close = () => {
    if (loading) return
    setOpen(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error al crear el grupo')
        return
      }
      setOpen(false)
      router.push(`/groups/${data.id}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={openModal}>
        + Crear grupo
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="bg-bg-secondary border border-border-default rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-text-primary font-black text-lg mb-1">Nuevo grupo</h2>
            <p className="text-text-muted text-sm mb-5">Ponle un nombre a tu grupo</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Equipo cardio lunes"
                  maxLength={60}
                  className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-[#FF471A33] transition-colors"
                />
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={close} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={loading}
                  disabled={!name.trim() || name.trim().length < 2}
                >
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
