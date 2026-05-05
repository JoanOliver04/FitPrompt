import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserCard } from '@/components/social/UserCard'

export const metadata: Metadata = {
  title: 'Social — FitPrompt',
}

export default async function SocialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [myFollowIds, followersCount, allUsers] = await Promise.all([
    db.follow.findMany({
      where:  { followerId: userId },
      select: { followingId: true },
    }),
    db.follow.count({ where: { followingId: userId } }),
    db.user.findMany({
      where:   { id: { not: userId } },
      select:  { id: true, name: true, image: true, plan: true },
      orderBy: { createdAt: 'asc' },
      take:    50,
    }),
  ])

  const followingIds   = new Set(myFollowIds.map(f => f.followingId))
  const followingCount = myFollowIds.length

  const following = allUsers.filter(u => followingIds.has(u.id))
  const discover  = allUsers.filter(u => !followingIds.has(u.id))

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full animate-enter">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">👥</span>
          <h1 className="text-2xl font-bold text-text-primary">Social</h1>
        </div>
        <p className="text-text-muted text-sm ml-11">
          Conecta con otros atletas de FitPrompt
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-text-primary tabular-nums">{followersCount}</p>
          <p className="text-text-muted text-xs mt-1 uppercase tracking-wide">Seguidores</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-text-primary tabular-nums">{followingCount}</p>
          <p className="text-text-muted text-xs mt-1 uppercase tracking-wide">Siguiendo</p>
        </div>
      </div>

      {/* Following */}
      {following.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            Siguiendo ({following.length})
          </h2>
          <div className="space-y-2">
            {following.map(user => (
              <UserCard
                key={user.id}
                user={user}
                isFollowing={true}
                currentUserId={userId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discover */}
      {discover.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {following.length > 0 ? `Descubrir (${discover.length})` : `Atletas (${discover.length})`}
          </h2>
          <div className="space-y-2">
            {discover.map(user => (
              <UserCard
                key={user.id}
                user={user}
                isFollowing={false}
                currentUserId={userId}
              />
            ))}
          </div>
        </section>
      )}

      {allUsers.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-text-primary font-bold mb-1">Sin otros usuarios aún</p>
          <p className="text-text-muted text-sm">Cuando más personas se unan aparecerán aquí.</p>
        </div>
      )}

    </div>
  )
}
