'use client'

import { useState } from 'react'

const Spinner = () => (
  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
)

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current)            { setError('Introduce tu contraseña actual'); return }
    if (next.length < 8)     { setError('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (next !== confirm)    { setError('Las contraseñas nuevas no coinciden'); return }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar la contraseña')
        return
      }
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
          Contraseña actualizada correctamente. Todas las sesiones activas han sido cerradas.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="current-pw" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Contraseña actual
        </label>
        <input
          id="current-pw"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="new-pw" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Nueva contraseña
        </label>
        <input
          id="new-pw"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="confirm-pw" className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          Confirmar nueva contraseña
        </label>
        <input
          id="confirm-pw"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la nueva contraseña"
          className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <><Spinner /> Guardando...</> : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  )
}
