import { FollowButton } from './FollowButton'

interface User {
  id:    string
  name:  string | null
  image: string | null
  plan:  string
}

interface Props {
  user:          User
  isFollowing:   boolean
  currentUserId: string
}

export function UserCard({ user, isFollowing, currentUserId }: Props) {
  const isMe = user.id === currentUserId

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-tertiary">

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0 overflow-hidden">
        {user.image
          ? <img src={user.image} alt="" className="w-full h-full object-cover" />
          : <span className="text-lg">👤</span>
        }
      </div>

      {/* Name + plan */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-text-primary text-sm font-semibold truncate">
            {user.name ?? 'Atleta'}
          </p>
          {user.plan === 'premium' && (
            <span className="text-[9px] bg-[#FF471A]/15 text-[#FF471A] border border-[#FF471A]/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
              PRO
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      {isMe
        ? <span className="text-xs text-text-muted font-medium shrink-0">Tú</span>
        : <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
      }
    </div>
  )
}
