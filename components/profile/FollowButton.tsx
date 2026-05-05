'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  targetUserId: string
  initialIsFollowing: boolean
  initialFollowersCount: number
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowersCount,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/social/follow/${targetUserId}`, { method })
      if (res.ok) {
        const data = (await res.json()) as { followersCount: number }
        setIsFollowing((prev) => !prev)
        setFollowersCount(data.followersCount)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted text-xs tabular-nums">{followersCount} seguidores</span>
      <Button
        variant={isFollowing ? 'secondary' : 'primary'}
        size="sm"
        loading={loading}
        onClick={toggle}
      >
        {isFollowing ? '✓ Siguiendo' : '+ Seguir'}
      </Button>
    </div>
  )
}
