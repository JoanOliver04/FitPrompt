// lib/auth.ts — Configuración de NextAuth + store temporal en memoria
//
// El store en memoria (Map de usuarios) es solo para desarrollo.
// En Fase 03: sustituir findUserByEmail y createUser por llamadas a Prisma.
//   Ejemplo: const user = await db.user.findUnique({ where: { email } })

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import type { Plan } from '@/types'

// ─── Store temporal ───────────────────────────────────────────────────────────
// Reemplazar por Prisma en Fase 03

interface StoredUser {
  id: string
  email: string
  name: string
  password: string | null  // null para usuarios de OAuth
  image: string | null
  plan: Plan
  createdAt: Date
}

const users = new Map<string, StoredUser>()

export function findUserByEmail(email: string): StoredUser | undefined {
  return Array.from(users.values()).find((u) => u.email === email)
}

export function createUser(data: Omit<StoredUser, 'id' | 'createdAt'>): StoredUser {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
  const user: StoredUser = { ...data, id, createdAt: new Date() }
  users.set(id, user)
  return user
}

// ─── Configuración NextAuth ───────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      // Las credenciales vacías no rompen el build; simplemente no aparece el botón de Google
      // hasta que se configuren en .env.local
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = findUserByEmail(credentials.email)
        if (!user || !user.password) return null

        const valid = await compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',  // NextAuth añade ?error=... a esta URL
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Al hacer sign in, adjuntar datos del usuario al token
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: Plan }).plan ?? 'free'
      }

      // Usuarios de Google: crear en el store si es su primer login
      if (account?.provider === 'google' && token.email) {
        const existing = findUserByEmail(token.email)
        if (!existing) {
          const created = createUser({
            email: token.email,
            name: token.name ?? '',
            password: null,
            image: token.picture ?? null,
            plan: 'free',
          })
          token.id = created.id
          token.plan = 'free'
        } else {
          token.id = existing.id
          token.plan = existing.plan
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.plan = (token.plan ?? 'free') as Plan
      }
      return session
    },
  },
}
