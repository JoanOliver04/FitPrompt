'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function DeleteAccountButton() {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
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
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-800/60 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
    </button>
  )
}
