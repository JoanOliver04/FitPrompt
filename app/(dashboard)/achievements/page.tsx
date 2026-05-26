import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BADGE_DEFINITIONS, BADGE_CATEGORIES } from '@/lib/badges'
import { BadgeCard } from '@/components/ui/BadgeCard'

export const metadata: Metadata = {
  title: 'Logros — FitPrompt',
}

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const achievements = await db.achievement.findMany({
    where:  { userId: session.user.id },
    select: { badge: true, unlockedAt: true },
  })

  const earnedMap   = new Map(achievements.map(a => [a.badge, a.unlockedAt]))
  const earnedCount = achievements.length
  const totalCount  = BADGE_DEFINITIONS.length
  const progress    = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full animate-enter">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏆</span>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Logros</h1>
            <p className="text-text-muted text-sm">
              {earnedCount} de {totalCount} desbloqueados
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-text-primary">{Math.round(progress)}%</p>
            <p className="text-text-muted text-xs">completado</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-default">
          <div
            className="h-full bg-gradient-to-r from-[#FF471A] to-[#FF6B3D] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-[#FF471A]" />
            {earnedCount} conseguidos
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
            {totalCount - earnedCount} por desbloquear
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {BADGE_CATEGORIES.map(({ id, label }) => {
          const badges = BADGE_DEFINITIONS.filter(b => b.category === id)
          if (!badges.length) return null
          const catEarned = badges.filter(b => earnedMap.has(b.id)).length

          return (
            <section key={id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-text-primary">{label}</h2>
                <span className="text-xs text-text-muted font-medium">
                  {catEarned}/{badges.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {badges.map((def) => (
                  <BadgeCard
                    key={def.id}
                    definition={def}
                    earned={earnedMap.has(def.id)}
                    earnedAt={earnedMap.get(def.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

    </div>
  )
}
