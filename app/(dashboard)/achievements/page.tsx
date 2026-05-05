import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BADGE_DEFINITIONS } from '@/lib/badges'
import { BadgeCard } from '@/components/ui/BadgeCard'

export const metadata: Metadata = {
  title: 'Logros — FitPrompt',
}

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const achievements = await db.achievement.findMany({
    where: { userId: session.user.id },
    select: { badge: true, unlockedAt: true },
  })

  const earnedMap = new Map(achievements.map(a => [a.badge, a.unlockedAt]))
  const earnedCount = achievements.length
  const totalCount = BADGE_DEFINITIONS.length
  const progress = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-enter">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏆</span>
          <h1 className="text-2xl font-bold text-text-primary">Logros</h1>
        </div>
        <p className="text-text-muted text-sm ml-11">
          {earnedCount} de {totalCount} desbloqueados
        </p>
        <div className="mt-4 h-1.5 bg-bg-secondary rounded-full overflow-hidden border border-border-default">
          <div
            className="h-full bg-gradient-to-r from-[#FF471A] to-[#FF6B3D] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Unlocked section */}
      {earnedCount > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
            Desbloqueados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BADGE_DEFINITIONS.filter(def => earnedMap.has(def.id)).map((def) => (
              <BadgeCard
                key={def.id}
                definition={def}
                earned
                earnedAt={earnedMap.get(def.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Locked section */}
      {BADGE_DEFINITIONS.some(def => !earnedMap.has(def.id)) && (
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
            Por desbloquear
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {BADGE_DEFINITIONS.filter(def => !earnedMap.has(def.id)).map((def) => (
              <BadgeCard
                key={def.id}
                definition={def}
                earned={false}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
