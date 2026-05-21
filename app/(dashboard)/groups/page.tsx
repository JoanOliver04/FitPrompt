import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import GroupCard from '@/components/groups/GroupCard'
import CreateGroupButton from '@/components/groups/CreateGroupButton'
import PremiumGate from '@/components/ui/PremiumGate'
import type { Group, Plan } from '@/types'

export const metadata: Metadata = { title: 'Grupos' }

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const userId    = session.user.id
  const plan      = (session.user as { plan?: Plan }).plan ?? 'free'
  const isPremium = plan === 'premium'

  const memberships = await db.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const groups: Group[] = memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    createdBy: group.createdBy,
    createdAt: group.createdAt,
    memberCount: group._count.members,
  }))

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Grupos</h1>
          <p className="text-text-muted text-sm">Entrena en equipo</p>
        </div>
        <CreateGroupButton isPremium={isPremium} />
      </div>

      {/* Free plan: show PremiumGate when user has no groups yet */}
      {!isPremium && groups.length === 0 && (
        <PremiumGate
          feature="Grupos sociales"
          description="Crea grupos de entrenamiento, compite con amigos y sigue un ranking compartido."
        />
      )}

      {/* List */}
      {groups.length > 0 ? (
        <div className="grid gap-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isCreator={group.createdBy === userId}
            />
          ))}
        </div>
      ) : isPremium ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">👥</span>
          <p className="text-text-primary font-bold mb-1">Sin grupos todavía</p>
          <p className="text-text-muted text-sm">Crea uno o pide a alguien que te invite</p>
        </div>
      ) : null}
    </div>
  )
}
