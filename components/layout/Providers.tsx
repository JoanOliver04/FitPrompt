'use client'

import { SessionProvider } from 'next-auth/react'
import { LevelUpProvider } from '@/context/LevelUpContext'
import { ToastProvider } from '@/context/ToastContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LevelUpProvider>
        <ToastProvider>{children}</ToastProvider>
      </LevelUpProvider>
    </SessionProvider>
  )
}
