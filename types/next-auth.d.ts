// types/next-auth.d.ts — Extensión de los tipos de NextAuth
//
// Añade `id` y `plan` al objeto session.user y al JWT,
// de forma que TypeScript los conozca en toda la app.

import type { DefaultSession } from 'next-auth'
import type { Plan } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      plan: Plan
    } & DefaultSession['user']
  }

  interface User {
    plan?: Plan
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: Plan
  }
}
