'use client'

import { SessionProvider } from 'next-auth/react'
import { LevelUpProvider } from '@/context/LevelUpContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LevelUpProvider>{children}</LevelUpProvider>
    </SessionProvider>
  )
}
