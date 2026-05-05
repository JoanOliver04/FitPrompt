import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import InviteButton from '@/components/groups/InviteButton'

export async function generateMetadata({
  params,
}: {
  params: { groupId: string }
}): Promise<Metadata> {
  const group = await db.group.findUnique({
    where: { id: params.groupId },
    select: { name: true },
  })
  return { title: group?.name ?? 'Grupo' }
}

export default async function GroupDetailPage({
  params,
}: {
  params: { groupId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const group = await db.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()

  const isMember = group.members.some((m) => m.userId === userId)
  if (!isMember) notFound()

  const isCreator = group.createdBy === userId
  const memberIds = new Set(group.members.map((m) => m.userId))

  // Inviteable: people creator follows who are not already members
  const inviteable = isCreator
    ? await db.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, name: true, image: true } } },
      }).then((rows) => rows.filter((r) => !memberIds.has(r.followingId)))
    : []

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">

      {/* Back */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Grupos
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0">
          <span className="text-2xl">👥</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-text-primary">{group.name}</h1>
            {isCreator && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF471A1A] border border-[#FF471A33] text-[#FF471A]">
                Admin
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm">
            {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'}
          </p>
        </div>
      </div>

      {/* Members */}
      <Card className="mb-4">
        <CardHeader title="Miembros" />
        <CardContent className="pt-0">
          <ul className="divide-y divide-border-default">
            {group.members.map(({ user, joinedAt }) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? ''}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border-default flex items-center justify-center shrink-0">
                    <span className="text-base">👤</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {user.name ?? 'Atleta'}
                  </p>
                  <p className="text-text-muted text-xs">
                    {user.id === group.createdBy ? 'Admin · ' : ''}
                    desde {new Date(joinedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <Link
                  href={`/profile/${user.id}`}
                  className="text-text-muted hover:text-text-primary text-xs transition-colors"
                >
                  Ver →
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Invite section — creator only */}
      {isCreator && (
        <Card>
          <CardHeader
            title="Invitar"
            description="Personas que sigues que aún no están en el grupo"
          />
          <CardContent className="pt-0">
            {inviteable.length === 0 ? (
              <p className="text-text-muted text-sm py-2">
                Todos tus seguidos ya son miembros, o aún no sigues a nadie.
              </p>
            ) : (
              <ul className="divide-y divide-border-default">
                {inviteable.map(({ following }) => (
                  <li key={following.id} className="flex items-center gap-3 py-3">
                    {following.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={following.image}
                        alt={following.name ?? ''}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border-default flex items-center justify-center shrink-0">
                        <span className="text-base">👤</span>
                      </div>
                    )}
                    <p className="flex-1 text-text-primary text-sm font-medium truncate">
                      {following.name ?? 'Atleta'}
                    </p>
                    <InviteButton groupId={group.id} userId={following.id} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
