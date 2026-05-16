'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteRoutineButton({ routineId }: { routineId: string }) {
  const router    = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/routines/${routineId}`, { method: 'DELETE' })
    router.push('/routines')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">¿Seguro?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg px-3 py-1.5 transition-colors"
        >
          {loading ? '...' : 'Eliminar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-text-muted hover:text-red-400 border border-border-default hover:border-red-400/30 rounded-xl px-3.5 py-2 transition-all"
    >
      Eliminar
    </button>
  )
}
