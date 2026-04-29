import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import type { Plan } from '@/types'

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

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          image: user.image,
          plan: user.plan as Plan,
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: Plan }).plan ?? 'free'
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
            },
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
