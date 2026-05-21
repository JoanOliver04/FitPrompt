'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FollowState = 'none' | 'pending' | 'following'

interface Props {
  targetUserId:       string
  initialIsFollowing: boolean
  initialIsPending?:  boolean
}

export function FollowButton({ targetUserId, initialIsFollowing, initialIsPending = false }: Props) {
  const router = useRouter()
  const [state, setState] = useState<FollowState>(
    initialIsFollowing ? 'following' : initialIsPending ? 'pending' : 'none',
  )
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)

    if (state === 'none') {
      const res = await fetch(`/api/social/follow/${targetUserId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { status: 'following' | 'pending' }
        setState(data.status)
        router.refresh()
      }
    } else {
      // unfollow or cancel request
      setState('none')
      const res = await fetch(`/api/social/follow/${targetUserId}`, { method: 'DELETE' })
      if (!res.ok) {
        setState(state) // revert
      } else {
        router.refresh()
      }
    }

    setLoading(false)
  }

  const label =
    state === 'following' ? 'Siguiendo' :
    state === 'pending'   ? 'Pendiente' :
    'Seguir'

  const className = [
    'text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 shrink-0 min-w-[84px] text-center flex items-center justify-center gap-1.5',
    state === 'following'
      ? 'bg-bg-tertiary border border-border-default text-text-secondary hover:border-red-800/50 hover:text-red-400'
      : state === 'pending'
        ? 'bg-[#FF471A]/10 border border-[#FF471A]/30 text-[#FF471A]'
        : 'bg-[#FF471A] hover:bg-[#e03d15] text-white shadow-sm',
  ].join(' ')

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={className}
    >
      {loading
        ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : (
          <>
            {state === 'pending' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            )}
            {label}
          </>
        )
      }
    </button>
  )
}
