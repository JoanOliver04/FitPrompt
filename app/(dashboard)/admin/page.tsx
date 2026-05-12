import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/roles'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Admin — FitPrompt',
}

export default async function AdminPage() {
  await requireAdmin()

  const [totalUsers, freeUsers, premiumUsers, totalChats, recentUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: 'free' } }),
    db.user.count({ where: { plan: 'premium' } }),
    db.chat.count(),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: 'Usuarios totales', value: totalUsers, icon: '👥' },
    { label: 'Plan Free', value: freeUsers, icon: '🆓' },
    { label: 'Plan Premium', value: premiumUsers, icon: '⭐' },
    { label: 'Chats totales', value: totalChats, icon: '💬' },
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

      {/* Recent users */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">
        <h2 className="text-text-primary font-bold mb-4">Usuarios recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-left border-b border-border-default">
                <th className="pb-3 font-medium pr-4">Nombre</th>
                <th className="pb-3 font-medium pr-4">Email</th>
                <th className="pb-3 font-medium pr-4">Plan</th>
                <th className="pb-3 font-medium pr-4">Rol</th>
                <th className="pb-3 font-medium">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {recentUsers.map((u) => (
                <tr key={u.id} className="text-text-secondary">
                  <td className="py-3 pr-4 font-medium text-text-primary">{u.name ?? '—'}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.plan === 'premium'
                          ? 'bg-[#FF471A1A] text-[#FF471A] border border-[#FF471A33]'
                          : 'bg-bg-tertiary text-text-muted border border-border-default'
                      }`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-[#FF471A] text-white'
                          : 'bg-bg-tertiary text-text-muted border border-border-default'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-text-muted">
                    {u.createdAt.toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
