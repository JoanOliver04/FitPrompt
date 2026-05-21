'use client'

import { useState } from 'react'

interface Props {
  groupId: string
  userId:  string
}

export default function InviteButton({ groupId, userId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function invite() {
    setStatus('loading')
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })
    setStatus(res.ok ? 'sent' : 'error')
  }

  if (status === 'sent') {
    return <span className="text-xs font-semibold text-[#FF471A]">✓ Invitación enviada</span>
  }

  if (status === 'error') {
    return <span className="text-xs font-semibold text-red-400">Error al invitar</span>
  }

  return (
    <button
      type="button"
      disabled={status === 'loading'}
      onClick={invite}
      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#FF471A] hover:bg-[#e03d15] text-white disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5"
    >
      {status === 'loading'
        ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 5.68a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.91 10.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Invitar
          </>
        )
      }
    </button>
  )
}
