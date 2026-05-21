'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FollowState = 'none' | 'pending' | 'following'

interface Props {
  targetUserId:          string
  initialIsFollowing:    boolean
  initialIsPending?:     boolean
  initialFollowersCount: number
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialIsPending = false,
  initialFollowersCount,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<FollowState>(
    initialIsFollowing ? 'following' : initialIsPending ? 'pending' : 'none',
  )
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading]               = useState(false)

  async function toggle() {
    setLoading(true)
    if (state === 'none') {
      const res = await fetch(`/api/social/follow/${targetUserId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { status: 'following' | 'pending' }
        setState(data.status)
        if (data.status === 'following') setFollowersCount(c => c + 1)
        router.refresh()
      }
    } else {
      const prev = state
      setState('none')
      if (prev === 'following') setFollowersCount(c => Math.max(0, c - 1))
      const res = await fetch(`/api/social/follow/${targetUserId}`, { method: 'DELETE' })
      if (!res.ok) {
        setState(prev)
        if (prev === 'following') setFollowersCount(c => c + 1)
      } else {
        router.refresh()
      }
    }
    setLoading(false)
  }

  const label =
    state === 'following' ? '✓ Siguiendo' :
    state === 'pending'   ? '⏳ Pendiente' :
    '+ Seguir'

  const btnClass = [
    'text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60 min-w-[100px] text-center',
    state === 'following'
      ? 'bg-bg-tertiary border border-border-default text-text-secondary hover:border-red-800/50 hover:text-red-400'
      : state === 'pending'
        ? 'bg-[#FF471A]/10 border border-[#FF471A]/30 text-[#FF471A]'
        : 'bg-[#FF471A] hover:bg-[#e03d15] text-white shadow-sm',
  ].join(' ')

  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-text-muted text-xs tabular-nums">{followersCount} seguidores</span>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={btnClass}
      >
        {loading
          ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : label
        }
      </button>
    </div>
  )
}
