'use client'

import { useState } from 'react'

interface AdminUser {
  id: string
  name: string | null
  email: string
  plan: string
  role: string
  createdAt: Date
}

interface Props {
  users: AdminUser[]
  currentUserId: string
}

export function AdminUsersTable({ users: initial, currentUserId }: Props) {
  const [users, setUsers] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(userId: string, email: string) {
    const confirmed = window.confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Error al eliminar el usuario')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } finally {
      setDeletingId(null)
    }
  }

  if (users.length === 0) {
    return <p className="text-text-muted text-sm py-4">No hay usuarios.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-muted text-left border-b border-border-default">
            <th className="pb-3 font-medium pr-4">Nombre</th>
            <th className="pb-3 font-medium pr-4">Email</th>
            <th className="pb-3 font-medium pr-4">Plan</th>
            <th className="pb-3 font-medium pr-4">Rol</th>
            <th className="pb-3 font-medium pr-4">Registro</th>
            <th className="pb-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {users.map((u) => {
            const isCurrentUser = u.id === currentUserId
            const isAdmin = u.role === 'ADMIN'
            const isDeleting = deletingId === u.id
            const canDelete = !isCurrentUser && !isAdmin

            return (
              <tr key={u.id} className="text-text-secondary">
                <td className="py-3 pr-4 font-medium text-text-primary">{u.name ?? '—'}</td>
                <td className="py-3 pr-4 text-xs">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    u.plan === 'premium'
                      ? 'bg-[#FF471A1A] text-[#FF471A] border border-[#FF471A33]'
                      : 'bg-bg-tertiary text-text-muted border border-border-default'
                  }`}>
                    {u.plan}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-[#FF471A] text-white'
                      : 'bg-bg-tertiary text-text-muted border border-border-default'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-text-muted text-xs">
                  {new Date(u.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="py-3 text-right">
                  {isCurrentUser ? (
                    <span className="text-text-muted text-xs">Tú</span>
                  ) : isAdmin ? (
                    <span className="text-text-muted text-xs">—</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canDelete || isDeleting}
                      onClick={() => handleDelete(u.id, u.email)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
