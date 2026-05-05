'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  targetUserId:       string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: Props) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    // Optimistic update
    setIsFollowing(prev => !prev)

    const res = await fetch(`/api/social/follow/${targetUserId}`, {
      method: isFollowing ? 'DELETE' : 'POST',
    })

    if (!res.ok) {
      // Revert on error
      setIsFollowing(prev => !prev)
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={[
        'text-xs font-bold px-4 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0',
        isFollowing
          ? 'bg-bg-tertiary border border-border-default text-text-secondary hover:border-red-800/50 hover:text-red-400'
          : 'bg-[#FF471A] hover:bg-[#e03d15] text-white',
      ].join(' ')}
    >
      {loading ? '…' : isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
