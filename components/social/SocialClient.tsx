'use client'

import { useState } from 'react'
import { UserCard } from './UserCard'
import type { SocialUser } from '@/types'

interface Props {
  otherUsers:   SocialUser[]
  followers:    SocialUser[]
  rankingUsers: SocialUser[]
  me:           SocialUser
  myRank:       number
}

type Tab = 'Descubrir' | 'Siguiendo' | 'Seguidores' | 'Ranking'

export function SocialClient({ otherUsers, followers, rankingUsers, me, myRank }: Props) {
  const [tab, setTab]       = useState<Tab>('Descubrir')
  const [search, setSearch] = useState('')

  const following = otherUsers.filter(u => u.isFollowing)
  const discover  = otherUsers.filter(u => !u.isFollowing)

  const q = search.toLowerCase().trim()
  const base =
    tab === 'Siguiendo'  ? following  :
    tab === 'Seguidores' ? followers  :
    tab === 'Descubrir'  ? discover   : rankingUsers
  const filtered = q ? base.filter(u => u.name?.toLowerCase().includes(q)) : base

  const xpPct = Math.min(100, Math.round((me.xpCurrent / me.xpMax) * 100))

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#FF471A0A] via-transparent to-transparent border-b border-border-default px-6 pt-6 pb-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center overflow-hidden shrink-0">
              {me.image
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={me.image} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl">👤</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text-primary font-black text-lg leading-tight truncate">
                    {me.name ?? 'Atleta'}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    Nv.{me.level} · {me.levelName}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#FF471A]/10 border border-[#FF471A]/20 rounded-xl px-3 py-1.5 shrink-0">
                  <span className="text-[#FF471A] font-black text-sm">#{myRank}</span>
                  <span className="text-[#FF471A66] text-[10px] font-semibold">ranking</span>
                </div>
              </div>

              {/* XP bar */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                  <span>{me.xpCurrent.toLocaleString('es')} XP</span>
                  <span>{me.xpMax.toLocaleString('es')} XP</span>
                </div>
                <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF471A] to-[#ff6b3d] rounded-full transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { icon: '🔥', label: 'Racha',      value: me.currentStreak,                  tab: undefined },
              { icon: '⚡', label: 'XP total',   value: me.totalXP.toLocaleString('es'),   tab: undefined },
              { icon: '💪', label: 'Entrenos',   value: me.workoutCount,                   tab: undefined },
              { icon: '👥', label: 'Seguidores', value: followers.length,                  tab: 'Seguidores' as Tab },
              { icon: '➕', label: 'Siguiendo',  value: following.length,                  tab: 'Siguiendo' as Tab },
            ].map(({ icon, label, value, tab: chipTab }) => (
              chipTab
                ? (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setTab(chipTab); setSearch('') }}
                    className="flex items-center gap-1.5 bg-bg-secondary border border-border-default hover:border-[#FF471A]/40 rounded-xl px-3 py-1.5 text-xs transition-colors"
                  >
                    <span>{icon}</span>
                    <span className="text-text-muted">{label}:</span>
                    <span className="text-text-primary font-bold">{value}</span>
                  </button>
                )
                : (
                  <div key={label} className="flex items-center gap-1.5 bg-bg-secondary border border-border-default rounded-xl px-3 py-1.5 text-xs">
                    <span>{icon}</span>
                    <span className="text-text-muted">{label}:</span>
                    <span className="text-text-primary font-bold">{value}</span>
                  </div>
                )
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-5">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-bg-tertiary rounded-2xl mb-5">
          {(['Descubrir', 'Siguiendo', 'Seguidores', 'Ranking'] as Tab[]).map(t => {
            const count =
              t === 'Siguiendo'  ? following.length :
              t === 'Seguidores' ? followers.length : 0
            return (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setSearch('') }}
                className={[
                  'flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                  tab === t
                    ? 'bg-[#FF471A] text-white shadow-md'
                    : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
              >
                {t}
                {count > 0 && (
                  <span className={[
                    'ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-black',
                    tab === t ? 'bg-white/25 text-white' : 'bg-bg-secondary text-text-muted',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search (hidden on Ranking) */}
        {tab !== 'Ranking' && tab !== 'Seguidores' && (
          <div className="relative mb-5">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar atletas..."
              className="w-full bg-bg-tertiary border border-border-default rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#FF471A]/40 transition-colors"
            />
          </div>
        )}

        {/* Tab content */}
        {tab === 'Ranking'
          ? <RankingView users={filtered} hasSearch={false} />
          : tab === 'Seguidores'
            ? <ListView
                users={followers}
                emptyMsg="Aún nadie te sigue"
                emptyHint="Comparte tu perfil para conseguir seguidores"
              />
            : <ListView
                users={filtered}
                emptyMsg={
                  tab === 'Siguiendo'
                    ? 'Aún no sigues a nadie'
                    : q ? `Sin resultados para "${q}"` : '¡Ya sigues a todos!'
                }
                emptyHint={tab === 'Siguiendo' ? 'Descubre atletas en la pestaña Descubrir' : undefined}
              />
        }
      </div>
    </div>
  )
}

// ── ListView ────────────────────────────────────────────────────────────────

function ListView({
  users,
  emptyMsg,
  emptyHint,
}: {
  users: SocialUser[]
  emptyMsg: string
  emptyHint?: string
}) {
  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-3">👥</p>
        <p className="text-text-primary font-bold mb-1">{emptyMsg}</p>
        {emptyHint && <p className="text-text-muted text-sm mt-1">{emptyHint}</p>}
      </div>
    )
  }
  return (
    <div className="space-y-2.5">
      {users.map(u => <UserCard key={u.id} user={u} />)}
    </div>
  )
}

// ── RankingView ──────────────────────────────────────────────────────────────

function RankingView({ users }: { users: SocialUser[]; hasSearch: boolean }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-3">🏆</p>
        <p className="text-text-primary font-bold">Sin atletas aún</p>
      </div>
    )
  }

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div>
      {top3.length >= 2 && <Podium top3={top3} />}
      {rest.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {rest.map((u, i) => (
            <UserCard key={u.id} user={u} rank={i + 4} />
          ))}
        </div>
      )}
      {top3.length < 2 && (
        <div className="space-y-2.5">
          {users.map((u, i) => <UserCard key={u.id} user={u} rank={i + 1} />)}
        </div>
      )}
    </div>
  )
}

// ── Podium ───────────────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: SocialUser[] }) {
  // Display order: silver(#2) | gold(#1) | bronze(#3)
  const entries = [
    {
      user:        top3[1] ?? null,
      rank:        2,
      podiumH:     'h-20',
      podiumBg:    'bg-slate-400/8 border-slate-400/20',
      avatarBorder:'border-slate-400/50',
      textColor:   'text-slate-300',
      avatarSize:  'w-14 h-14',
      medal:       '🥈',
    },
    {
      user:        top3[0],
      rank:        1,
      podiumH:     'h-28',
      podiumBg:    'bg-yellow-400/8 border-yellow-400/25',
      avatarBorder:'border-yellow-400/60',
      textColor:   'text-yellow-400',
      avatarSize:  'w-16 h-16',
      medal:       '🥇',
    },
    {
      user:        top3[2] ?? null,
      rank:        3,
      podiumH:     'h-14',
      podiumBg:    'bg-orange-600/8 border-orange-600/25',
      avatarBorder:'border-orange-500/50',
      textColor:   'text-orange-500',
      avatarSize:  'w-12 h-12',
      medal:       '🥉',
    },
  ]

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-5 overflow-hidden mb-1">
      <p className="text-center text-[11px] text-text-muted uppercase tracking-widest mb-6 font-semibold">
        🏆 Top ranking — XP total
      </p>

      <div className="flex items-end justify-center gap-3">
        {entries.map(({ user, rank, podiumH, podiumBg, avatarBorder, textColor, avatarSize, medal }, i) => {
          if (!user) return <div key={rank} className="flex-1 max-w-[110px]" />
          return (
            <div key={user.id} className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">

              {/* Avatar */}
              <div className={`${avatarSize} rounded-2xl border-2 ${avatarBorder} flex items-center justify-center overflow-hidden bg-bg-tertiary shrink-0`}>
                {user.image
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                  : <span className={i === 1 ? 'text-3xl' : 'text-xl'}>👤</span>
                }
              </div>

              {/* Name */}
              <div className="text-center w-full px-1">
                <p className={`text-xs font-bold truncate ${i === 1 ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {user.name?.split(' ')[0] ?? 'Atleta'}
                  {user.isMe && <span className="text-[#FF471A]"> ★</span>}
                </p>
                <p className={`text-[10px] font-bold tabular-nums mt-0.5 ${textColor}`}>
                  {user.totalXP.toLocaleString('es')} XP
                </p>
                <p className="text-[9px] text-text-muted mt-0.5">
                  Nv.{user.level} · {user.levelName}
                </p>
              </div>

              {/* Podium block */}
              <div className={`w-full ${podiumH} border rounded-t-xl ${podiumBg} flex items-center justify-center`}>
                <span className="text-2xl">{medal}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
