import { db } from '@/lib/db'
import type { NotificationType } from '@prisma/client'

// ─── Generic creator ──────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId:     string
  type:       NotificationType
  title:      string
  body?:      string
  href?:      string
  fromUserId?: string
}) {
  return db.notification.create({ data }).catch(() => null)
}

// ─── new_follower ─────────────────────────────────────────────────────────────

export async function notifyNewFollower(followerId: string, followingId: string) {
  const existing = await db.notification.findFirst({
    where: { userId: followingId, type: 'new_follower', fromUserId: followerId },
  })
  if (existing) return

  const follower = await db.user.findUnique({
    where:  { id: followerId },
    select: { name: true },
  })
  const name = follower?.name ?? 'Alguien'

  await createNotification({
    userId:     followingId,
    type:       'new_follower',
    title:      `${name} ha empezado a seguirte`,
    href:       '/social',
    fromUserId: followerId,
  })
}

// ─── rank_surpassed ───────────────────────────────────────────────────────────

export async function notifyRankSurpassed(userId: string, xpAdded: number) {
  const record = await db.userXP.findUnique({ where: { userId }, select: { totalXP: true } })
  if (!record) return

  const newXP  = record.totalXP
  const prevXP = newXP - xpAdded

  const me = await db.user.findUnique({ where: { id: userId }, select: { name: true } })
  const myName = me?.name ?? 'Un atleta'

  // Social contacts whose XP falls between old and new value (just surpassed)
  const surpassed = await db.userXP.findMany({
    where: {
      totalXP: { gt: prevXP, lte: newXP },
      userId:  { not: userId },
      user: {
        OR: [
          { followers: { some: { followerId:  userId } } },
          { following: { some: { followingId: userId } } },
        ],
      },
    },
    select: { userId: true },
  })

  await Promise.all(
    surpassed.map(u =>
      createNotification({
        userId:     u.userId,
        type:       'rank_surpassed',
        title:      `¡${myName} te ha superado en XP!`,
        body:       'Sigue entrenando para recuperar tu posición.',
        href:       `/compare/${userId}`,
        fromUserId: userId,
      }),
    ),
  )
}

// ─── group_invite ─────────────────────────────────────────────────────────────

export async function notifyGroupInvite(
  fromUserId: string,
  targetUserId: string,
  groupId: string,
  groupName: string,
) {
  const inviter = await db.user.findUnique({
    where:  { id: fromUserId },
    select: { name: true },
  })
  const name = inviter?.name ?? 'Alguien'

  await createNotification({
    userId:     targetUserId,
    type:       'group_invite',
    title:      `${name} te ha invitado al grupo "${groupName}"`,
    body:       'Únete para entrenar en equipo.',
    href:       `/groups/${groupId}`,
    fromUserId,
  })
}
