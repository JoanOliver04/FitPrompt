import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import type { Plan, Role } from '@/types'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
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

        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password) return null

        const valid = await compare(credentials.password, user.password)
        if (!valid) return null

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          image: user.image,
          plan: user.plan as Plan,
          role: user.role as Role,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id   = user.id
        token.plan = (user as { plan?: Plan }).plan ?? 'free'
        token.role = (user as { role?: Role }).role ?? 'USER'
      }

      if (account?.provider === 'google' && token.email) {
        const existing = await db.user.findUnique({ where: { email: token.email } })
        if (!existing) {
          const created = await db.user.create({
            data: {
              email: token.email,
              name: token.name ?? '',
              image: token.picture ?? null,
              plan: 'free',
              lastLoginAt: new Date(),
            },
          })
          token.id   = created.id
          token.plan = 'free'
          token.role = 'USER'
        } else {
          await db.user.update({
            where: { id: existing.id },
            data: { lastLoginAt: new Date() },
          })
          token.id   = existing.id
          token.plan = existing.plan
          token.role = existing.role as Role
        }
      }

      // Re-read plan and role from DB when the client explicitly triggers a session update
      // (called from CheckoutButton after Stripe redirects back with ?checkout=success)
      if (trigger === 'update' && token.id) {
        const row = await db.user.findUnique({
          where:  { id: token.id as string },
          select: { plan: true, role: true, image: true },
        })
        if (row) {
          token.plan = row.plan
          token.role = row.role as Role
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string
        session.user.plan = (token.plan ?? 'free') as Plan
        session.user.role = (token.role ?? 'USER') as Role
      }
      return session
    },
  },
}
