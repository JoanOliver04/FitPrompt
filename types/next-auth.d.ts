import type { DefaultSession } from 'next-auth'
import type { Plan, Role } from '@/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      plan: Plan
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    plan?: Plan
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: Plan
    role?: Role
  }
}
