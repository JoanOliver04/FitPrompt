'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  groupId: string
  userId: string
}

export default function InviteButton({ groupId, userId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const invite = async () => {
    setStatus('loading')
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setStatus(res.ok ? 'done' : 'idle')
  }

  if (status === 'done') {
    return (
      <span className="text-xs font-semibold text-green-400">✓ Añadido</span>
    )
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={status === 'loading'}
      onClick={invite}
    >
      Añadir
    </Button>
  )
}
