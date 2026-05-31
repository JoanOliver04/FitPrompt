import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deriveLevel } from '@/lib/xp'
import { SocialClient } from '@/components/social/SocialClient'
import type { SocialUser } from '@/types'

export const metadata: Metadata = {
  title: 'Social — FitPrompt',
}

export default async function SocialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null  // unreachable — DashboardLayout guards first

  const userId = session.user.id

  const select = {
    id:       true,
    name:     true,
    username: true,
    image:    true,
    plan:     true,
    isPublic: true,
    xp:          { select: { totalXP: true } },
    streak:      { select: { currentStreak: true } },
    _count: { select: { workoutLogs: true, achievements: true } },
  } as const

  const [myFollowIds, rawOthers, rawMe, sentRequests, rawFollowers] = await Promise.all([
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    db.user.findMany({ where: { id: { not: userId } }, select, take: 100 }),
    db.user.findUnique({ where: { id: userId }, select }),
    db.followRequest.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    db.follow.findMany({
      where:   { followingId: userId },
      select:  { follower: { select } },
      orderBy: { createdAt: 'desc' },
      take:    100,
    }),
  ])

  if (!rawMe) notFound()

  const followingIds = new Set(myFollowIds.map(f => f.followingId))
  const pendingIds   = new Set(sentRequests.map(r => r.toUserId))

  type Raw = typeof rawOthers[number]
  function toSocialUser(u: Raw, opts: { isFollowing: boolean; hasPendingRequest: boolean; isMe: boolean }): SocialUser {
    const totalXP = u.xp?.totalXP ?? 0
    const info    = deriveLevel(totalXP)
    return {
      id:               u.id,
      name:             u.name,
      username:         u.username,
      image:            u.image,
      plan:             u.plan,
      isPublic:         u.isPublic,
      totalXP,
      currentStreak:    u.streak?.currentStreak ?? 0,
      workoutCount:     u._count.workoutLogs,
      achievementCount: u._count.achievements,
      level:            info.level,
      levelName:        info.levelName,
      xpCurrent:        info.current,
      xpMax:            info.max,
      isFollowing:      opts.isFollowing,
      hasPendingRequest: opts.hasPendingRequest,
      isMe:             opts.isMe,
    }
  }

  const otherUsers: SocialUser[] = rawOthers.map(u =>
    toSocialUser(u, {
      isFollowing:       followingIds.has(u.id),
      hasPendingRequest: pendingIds.has(u.id),
      isMe:              false,
    })
  )

  const followers: SocialUser[] = rawFollowers.map(f =>
    toSocialUser(f.follower, {
      isFollowing:       followingIds.has(f.follower.id),
      hasPendingRequest: pendingIds.has(f.follower.id),
      isMe:              false,
    })
  )

  const meUser: SocialUser = toSocialUser(rawMe, { isFollowing: false, hasPendingRequest: false, isMe: true })

  const rankingUsers: SocialUser[] = [...otherUsers, meUser]
    .sort((a, b) => b.totalXP - a.totalXP)

  const myRank = rankingUsers.findIndex(u => u.isMe) + 1

  return (
    <SocialClient
      otherUsers={otherUsers}
      followers={followers}
      rankingUsers={rankingUsers}
      me={meUser}
      myRank={myRank}
    />
  )
}
