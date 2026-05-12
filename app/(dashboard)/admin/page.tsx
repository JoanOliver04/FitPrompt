import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/roles'
import { db } from '@/lib/db'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'

export const metadata: Metadata = {
  title: 'Admin — FitPrompt',
}

export default async function AdminPage() {
  const session = await requireAdmin()

  const [totalUsers, freeUsers, premiumUsers, totalChats, users] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'free' } }),
    db.user.count({ where: { plan: 'premium' } }),
    db.chat.count(),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: 'Usuarios totales', value: totalUsers,  icon: '👥' },
    { label: 'Plan Free',        value: freeUsers,    icon: '🆓' },
    { label: 'Plan Premium',     value: premiumUsers, icon: '⭐' },
    { label: 'Chats totales',    value: totalChats,   icon: '💬' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-black text-text-primary">Panel de administración</h1>
        <span className="bg-[#FF471A] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Admin
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-bg-secondary border border-border-default rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-text-primary tabular-nums">{s.value}</div>
            <div className="text-text-muted text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold">Usuarios</h2>
          <span className="text-text-muted text-xs">{totalUsers} en total</span>
        </div>
        <AdminUsersTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  )
}
