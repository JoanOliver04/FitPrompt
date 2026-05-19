import type { NextAuthOptions, Profile } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { emailVerificationRequired } from '@/lib/email'
import type { Plan, Role } from '@/types'

interface GoogleOidcProfile extends Profile {
  sub:            string
  email_verified?: boolean
  picture?:        string
}

export const authOptions: NextAuthOptions = {
  // 24h JWT; cookie expires alongside it. Sliding refresh every hour.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24, updateAge: 60 * 60 },
  jwt:     { maxAge: 60 * 60 * 24 },
  useSecureCookies: process.env.NODE_ENV === 'production',

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'openid email profile', prompt: 'consent' } },
      profile(profile: GoogleOidcProfile) {
        if (!profile.email_verified) {
          throw new Error('GoogleEmailNotVerified')
        }
        return {
          id:    profile.sub,
          email: profile.email!,
          name:  profile.name ?? '',
          image: profile.picture ?? null,
        }
      },
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null

        const email = credentials.email.toLowerCase().trim()

        // Per-email rate limit to mitigate online dictionary attacks.
        const gate = await rateLimit({ key: `login:${email}`, limit: 5, windowSec: 300 })
        if (!gate.ok) {
          logger.security('login_rate_limit', { email })
          return null
        }

        // Optional per-IP rate limit (NextAuth gives us req here).
        const ip = (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
        if (ip) {
          const ipGate = await rateLimit({ key: `login:ip:${ip}`, limit: 20, windowSec: 300 })
          if (!ipGate.ok) {
            logger.security('login_ip_rate_limit', { ip })
            return null
          }
        }

        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const valid = await compare(credentials.password, user.password)
        if (!valid) {
          logger.security('login_bad_password', { email })
          return null
        }

        if (emailVerificationRequired() && !user.emailVerified) {
          logger.security('login_email_unverified', { email })
          return null
        }

        await db.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        })

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? '',
          image: user.image,
          plan:  user.plan as Plan,
          role:  user.role as Role,
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Reject Google sign-ins for unverified addresses or accounts that look
      // like account-takeover attempts (existing credentials user without google link).
      if (account?.provider === 'google') {
        const p = profile as GoogleOidcProfile | undefined
        if (!p?.email_verified) return false
        if (!user.email) return false

        const existing = await db.user.findUnique({
          where:  { email: user.email },
          select: { id: true, googleSub: true, password: true },
        })
        if (existing?.password && !existing.googleSub) {
          logger.security('google_link_blocked_credentials_exists', { email: user.email })
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger }) {
      // First sign-in: hydrate from the user object returned by the provider.
      if (user) {
        token.id   = user.id
        token.plan = (user as { plan?: Plan }).plan ?? 'free'
        token.role = (user as { role?: Role }).role ?? 'USER'
      }

      // Google: provision user / link the OIDC subject.
      if (account?.provider === 'google' && token.email) {
        const existing = await db.user.findUnique({ where: { email: token.email } })
        if (!existing) {
          const created = await db.user.create({
            data: {
              email:         token.email,
              name:          token.name ?? '',
              image:         token.picture ?? null,
              plan:          'free',
              googleSub:     account.providerAccountId,
              emailVerified: new Date(),  // Google already verified
              lastLoginAt:   new Date(),
            },
          })
          token.id   = created.id
          token.plan = 'free'
          token.role = 'USER'
          token.ver  = 0
        } else {
          await db.user.update({
            where: { id: existing.id },
            data:  {
              lastLoginAt: new Date(),
              googleSub:   existing.googleSub ?? account.providerAccountId,
              emailVerified: existing.emailVerified ?? new Date(),
            },
          })
          token.id   = existing.id
          token.plan = existing.plan
          token.role = existing.role as Role
          token.ver  = existing.sessionVersion
        }
      }

      // Explicit session refresh — e.g. after a Stripe upgrade or profile edit.
      if (trigger === 'update' && token.id) {
        const row = await db.user.findUnique({
          where:  { id: token.id as string },
          select: { plan: true, role: true, sessionVersion: true },
        })
        if (row) {
          token.plan = row.plan
          token.role = row.role as Role
          token.ver  = row.sessionVersion
        }
      }

      // On subsequent requests, re-verify sessionVersion against the DB.
      // This is the revocation mechanism (password change, "sign out everywhere").
      if (!user && !account && token.id && token.ver !== undefined) {
        const row = await db.user.findUnique({
          where:  { id: token.id as string },
          select: { sessionVersion: true, plan: true, role: true },
        })
        if (!row || row.sessionVersion !== token.ver) {
          // Returning an empty token forces NextAuth to treat the session as invalid.
          return {}
        }
        token.plan = row.plan
        token.role = row.role as Role
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

    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith('/') && !url.startsWith('//')) return `${baseUrl}${url}`
        const parsed = new URL(url)
        if (parsed.origin === baseUrl) return url
      } catch {
        /* fall through */
      }
      return baseUrl
    },
  },

  events: {
    async signOut({ token }) {
      logger.info('signout', { userId: token?.id })
    },
  },
}
