'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function ProfileActions() {
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      '¿Estás seguro? Esta acción eliminará tu cuenta y todos tus datos de forma permanente.',
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar la cuenta')
      await signOut({ callbackUrl: '/' })
    } catch {
      alert('No se pudo eliminar la cuenta. Inténtalo de nuevo.')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full flex items-center justify-between bg-bg-secondary border border-border-default hover:border-text-subtle rounded-xl px-5 py-4 text-text-secondary hover:text-text-primary transition-all"
      >
        <span className="text-sm font-medium">🚪 Cerrar sesión</span>
        <span className="text-text-muted">›</span>
      </button>
      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={deleting}
        className="w-full flex items-center justify-between bg-bg-secondary border border-red-900/30 hover:border-red-800/60 rounded-xl px-5 py-4 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-sm font-medium">
          {deleting ? 'Eliminando...' : '🗑️ Eliminar cuenta'}
        </span>
        <span className="opacity-50">›</span>
      </button>
    </>
  )
}
