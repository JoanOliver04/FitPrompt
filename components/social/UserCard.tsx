import Link from 'next/link'
import { FollowButton } from './FollowButton'
import type { SocialUser } from '@/types'

interface Props {
  user: SocialUser
  rank?: number
}

export function UserCard({ user, rank }: Props) {
  const pct = Math.min(100, Math.round((user.xpCurrent / user.xpMax) * 100))

  const rankBadge =
    rank === 1 ? { bg: 'bg-yellow-400', text: 'text-black' } :
    rank === 2 ? { bg: 'bg-slate-300',  text: 'text-gray-800' } :
    rank === 3 ? { bg: 'bg-orange-600', text: 'text-white' } :
                 { bg: 'bg-bg-tertiary border border-border-default', text: 'text-text-muted' }

  return (
    <div className={[
      'relative flex items-center gap-3 p-4 rounded-2xl border transition-all',
      user.isMe
        ? 'bg-[#FF471A08] border-[#FF471A30]'
        : 'bg-bg-secondary border-border-default hover:border-[#FF471A30] hover:bg-[#FF471A04]',
    ].join(' ')}>

      {/* Rank badge */}
      {rank !== undefined && (
        <div className={[
          'absolute -top-2.5 -left-2.5 min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm',
          rankBadge.bg, rankBadge.text,
        ].join(' ')}>
          {rank}
        </div>
      )}

      {/* Avatar */}
      <div className="w-11 h-11 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 overflow-hidden">
        {user.image
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={user.image} alt="" className="w-full h-full object-cover" />
          : <span className="text-lg">👤</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">

        {/* Name row */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-text-primary text-sm font-bold truncate">
            {user.name ?? 'Atleta'}
          </p>
          {!user.isPublic && (
            <svg className="text-text-muted shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          )}
          {user.plan === 'premium' && (
            <span className="text-[9px] bg-[#FF471A]/15 text-[#FF471A] border border-[#FF471A]/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
              PRO
            </span>
          )}
          {user.isMe && (
            <span className="text-[9px] bg-[#FF471A]/10 text-[#FF471A] px-1.5 py-0.5 rounded-full font-bold shrink-0">
              Tú
            </span>
          )}
        </div>

        {user.username && (
          <p className="text-text-muted text-xs truncate mb-1">@{user.username}</p>
        )}

        {/* Stats chips */}
        <div className="flex items-center gap-2.5 text-[11px] mb-2 flex-wrap">
          <span className="text-text-secondary font-semibold">Nv.{user.level} · {user.levelName}</span>
          {user.currentStreak > 0 && (
            <span className="text-orange-400 font-semibold">🔥 {user.currentStreak}</span>
          )}
          <span className="text-text-muted">⚡ {user.totalXP.toLocaleString('es')}</span>
          {user.workoutCount > 0 && (
            <span className="text-text-muted">💪 {user.workoutCount}</span>
          )}
        </div>

        {/* XP progress bar */}
        <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF471A] to-[#ff6b3d] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {!user.isMe && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {/* Compare — only if following or public */}
          {(user.isFollowing || user.isPublic) && (
            <Link
              href={`/compare/${user.id}`}
              title="Comparar estadísticas"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-[#FF471A] hover:bg-[#FF471A0D] border border-transparent hover:border-[#FF471A30] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            </Link>
          )}
          <FollowButton
            targetUserId={user.id}
            initialIsFollowing={user.isFollowing}
            initialIsPending={user.hasPendingRequest}
          />
        </div>
      )}
    </div>
  )
}
