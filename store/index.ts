'use client'

import { createContext, createElement, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@/types'

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  dailyMessageCount: number
  incrementMessageCount: () => void
  resetMessageCount: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dailyMessageCount, setDailyMessageCount] = useState(0)

  const incrementMessageCount = useCallback(() => {
    setDailyMessageCount((n) => n + 1)
  }, [])

  const resetMessageCount = useCallback(() => {
    setDailyMessageCount(0)
  }, [])

  return createElement(
    AppContext.Provider,
    { value: { user, setUser, dailyMessageCount, incrementMessageCount, resetMessageCount } },
    children,
  )
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider')
  return ctx
}
