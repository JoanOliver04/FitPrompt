'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  groupId:   string
  groupName: string
}

export default function DeleteGroupButton({ groupId, groupName }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function remove() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? 'No se pudo eliminar el grupo.')
      setLoading(false)
      return
    }
    router.push('/groups')
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded-lg px-3 py-1.5 transition-all"
      >
        Eliminar grupo
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-secondary">
        ¿Eliminar <strong className="text-text-primary">{groupName}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={remove}
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-bg-tertiary border border-border-default text-text-muted hover:text-text-primary disabled:opacity-50 transition-all"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
    </div>
  )
}
