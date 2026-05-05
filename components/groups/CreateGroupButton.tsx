'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function CreateGroupButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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
