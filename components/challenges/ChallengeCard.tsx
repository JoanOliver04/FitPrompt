'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { useLevelUp } from '@/context/LevelUpContext'
import type { ChallengeDefinition } from '@/lib/challenges'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/challenges'
import type { LevelUpInfo } from '@/lib/xp'

interface Props {
  definition: ChallengeDefinition
  accepted:   boolean
  completed:  boolean
  progress:   number
}

function formatProgress(type: ChallengeDefinition['type'], value: number): string {
  if (type === 'volume_kg') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value} kg`
  }
  if (type === 'chat_messages') return `${value} msgs`
  return String(value)
}

export function ChallengeCard({ definition, accepted, completed, progress }: Props) {
  const router             = useRouter()
  const { addToast }       = useToast()
  const { triggerLevelUp } = useLevelUp()
  const [loading, setLoading] = useState<'accept' | 'claim' | null>(null)

  const pct       = Math.min(100, Math.round((progress / definition.target) * 100))
  const canClaim  = accepted && !completed && progress >= definition.target
  const remaining = Math.max(0, definition.target - progress)
  const diffStyle = DIFFICULTY_COLORS[definition.difficulty]

  async function handleAccept() {
    setLoading('accept')
    await fetch(`/api/challenges/${definition.id}/accept`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  async function handleClaim() {
    setLoading('claim')
    const res = await fetch(`/api/challenges/${definition.id}/complete`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as { xpGained: number; levelUp: LevelUpInfo | null; newBadge: { id: string; name: string; icon: string } | null }
      if (data.xpGained) addToast({ variant: 'xp', title: `+${data.xpGained} XP`, icon: '🎯' })
      if (data.newBadge) addToast({ variant: 'badge', title: `${data.newBadge.icon} ${data.newBadge.name}`, icon: data.newBadge.icon })
      if (data.levelUp)  triggerLevelUp(data.levelUp)
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className={[
      'relative bg-bg-secondary border rounded-2xl p-5 transition-all duration-200 overflow-hidden',
      completed  ? 'border-green-500/25 bg-green-500/5'   :
      canClaim   ? 'border-[#FF471A]/40 bg-[#FF471A]/5 shadow-lg shadow-[#FF471A]/5' :
      'border-border-default hover:border-border-subtle',
    ].join(' ')}>

      {/* Legendary shimmer */}
      {definition.difficulty === 'legendary' && !completed && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl leading-none mt-0.5 shrink-0">{definition.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-text-primary font-black text-sm leading-tight">{definition.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              {completed && (
                <span className="text-green-400 text-xs font-bold">✓ Completado</span>
              )}
              {canClaim && (
                <span className="text-[#FF471A] text-xs font-bold animate-pulse">¡A reclamar!</span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffStyle}`}>
                {DIFFICULTY_LABELS[definition.difficulty]}
              </span>
            </div>
          </div>
          <p className="text-text-muted text-xs leading-relaxed">{definition.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      {accepted && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-text-muted text-[11px] uppercase tracking-wide font-medium">Progreso</span>
            <span className="text-text-secondary text-[11px] font-bold tabular-nums">
              {formatProgress(definition.type, progress)} / {formatProgress(definition.type, definition.target)}
            </span>
          </div>
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border-default/50">
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                completed          ? 'bg-green-400' :
                pct >= 75          ? 'bg-gradient-to-r from-[#FF471A] to-[#FF6B3D]' :
                'bg-gradient-to-r from-[#FF471A]/70 to-[#FF471A]',
              ].join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!completed && (
            <p className="text-[10px] text-text-muted mt-1 text-right">{pct}%</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-black ${definition.color}`}>+{definition.xpReward} XP</span>
        </div>

        <div className="flex items-center gap-3">
          {!accepted && (
            <button
              onClick={handleAccept}
              disabled={loading === 'accept'}
              className="bg-bg-tertiary hover:bg-[#FF471A]/10 border border-border-default hover:border-[#FF471A]/40 disabled:opacity-50 text-text-primary text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              {loading === 'accept' ? 'Aceptando…' : 'Aceptar reto'}
            </button>
          )}

          {canClaim && (
            <button
              onClick={handleClaim}
              disabled={loading === 'claim'}
              className="bg-[#FF471A] hover:bg-[#e03d15] disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#FF471A]/25"
            >
              {loading === 'claim' ? 'Reclamando…' : `Reclamar +${definition.xpReward} XP 🎉`}
            </button>
          )}

          {completed && (
            <span className="text-green-400 text-xs font-semibold">+{definition.xpReward} XP ganados ✓</span>
          )}

          {accepted && !completed && !canClaim && (
            <span className="text-text-muted text-xs">
              {definition.type === 'volume_kg'
                ? `Faltan ${formatProgress(definition.type, remaining)}`
                : `Faltan ${remaining}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
