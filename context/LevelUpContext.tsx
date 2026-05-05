'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { LevelUpModal } from '@/components/ui/LevelUpModal'
import type { LevelUpInfo } from '@/lib/xp'

interface LevelUpContextValue {
  triggerLevelUp: (info: LevelUpInfo) => void
}

const LevelUpContext = createContext<LevelUpContextValue | null>(null)

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<LevelUpInfo | null>(null)

  const triggerLevelUp = useCallback((info: LevelUpInfo) => setPending(info), [])
  const dismiss        = useCallback(() => setPending(null), [])

  return (
    <LevelUpContext.Provider value={{ triggerLevelUp }}>
      {children}
      {pending && <LevelUpModal info={pending} onDismiss={dismiss} />}
    </LevelUpContext.Provider>
  )
}

export function useLevelUp() {
  const ctx = useContext(LevelUpContext)
  if (!ctx) throw new Error('useLevelUp must be used within LevelUpProvider')
  return ctx
}
