import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ─── Auth redirect architecture ────────────────────────────────────────────────
//
//  Layer 1 — Middleware (this file, runs on every request via Edge runtime)
//    Uses getToken() for a fast, DB-free JWT check.
//    • Unauthenticated requests to protected routes → /login?callbackUrl=[path]
//    • Authenticated requests to /login or /register  → /dashboard
//    • Non-admin requests to /admin routes            → /403
//
//  Layer 2 — Dashboard layout (app/(dashboard)/layout.tsx)
//    Uses getServerSession() as a backup server-side guard for all pages
//    under the (dashboard) route group. Catches edge cases where the JWT
//    is still valid but the session has been revoked (e.g. password change).
//    Individual pages must NOT add their own redirect('/login') — that
//    creates redundant hops and risks loops if the architecture changes.
//
//  Layer 3 — Pages and API routes
//    Call getServerSession() solely to read user data.
//    Only redirect for business logic (plan limits, resource not found, etc.).
//    Never redirect to /login — that belongs to Layers 1 and 2.
//
//  WHY public pages must be listed in PUBLIC_PAGES (bypass auth check):
//    Without this guard an unauthenticated visit to /login triggers a redirect
//    back to /login → ERR_TOO_MANY_REDIRECTS. The token check must be skipped
//    entirely for auth and marketing pages, not just for API internals.
//
// ───────────────────────────────────────────────────────────────────────────────

// API routes that DO NOT require an authenticated session.
const PUBLIC_API_ROUTES = new Set<string>([
  '/api/health',
  '/api/auth/register',
  '/api/stripe/webhook',        // has its own Stripe-signature verification
])

// Page routes accessible without a session.
// ADD new public pages here — never add them to the protected route list.
const PUBLIC_PAGES = new Set<string>(['/', '/login', '/register', '/pricing', '/403'])

function isNextAuthRoute(path: string): boolean {
  // /api/auth/* belongs to NextAuth (signin, callback, csrf, session, providers…).
  // /api/auth/register is OUR route — keep it explicit in PUBLIC_API_ROUTES.
  return path.startsWith('/api/auth/') && path !== '/api/auth/register'
}

function isSafeRelativePath(path: string | null): boolean {
  return !!path && path.startsWith('/') && !path.startsWith('//')
}

function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src':            ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),       // Next.js dev refresh needs eval
    ],
    'style-src':              ["'self'", "'unsafe-inline'"], // Tailwind utility classes
    'img-src': [
      "'self'", 'data:', 'blob:',
      'https://lh3.googleusercontent.com',
      'https://*.stripe.com',
    ],
    'font-src':               ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://api.groq.com',
      'https://api.anthropic.com',
      'https://api.stripe.com',
      ...(isDev ? ['ws:', 'wss:'] : []),
    ],
    'frame-src':              ['https://checkout.stripe.com', 'https://js.stripe.com'],
    'frame-ancestors':        ["'none'"],
    'base-uri':               ["'self'"],
    'form-action':            ["'self'"],
    'object-src':             ["'none'"],
    'manifest-src':           ["'self'"],
  }
  if (!isDev) directives['upgrade-insecure-requests'] = []
  return Object.entries(directives)
    .map(([k, v]) => v.length ? `${k} ${v.join(' ')}` : k)
    .join('; ')
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const secret = process.env.NEXTAUTH_SECRET
  const isDev = process.env.NODE_ENV !== 'production'

  if (!secret) {
    return new NextResponse('Server misconfiguration: NEXTAUTH_SECRET missing', { status: 500 })
  }

  const token = await getToken({ req: request, secret })

  // Per-request CSP nonce. The same nonce is exposed via the response header so
  // App Router pages can read it from `headers()` and pass to <Script nonce={…}>.
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')

  // ── API surface ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_ROUTES.has(pathname) || isNextAuthRoute(pathname)) {
      return NextResponse.next()
    }
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (pathname.startsWith('/api/admin/') && token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // ── Page routes ────────────────────────────────────────────────────────────
  // Public pages: always accessible. Redirect logged-in users away from auth pages.
  if (PUBLIC_PAGES.has(pathname)) {
    if (token && (pathname === '/login' || pathname === '/register')) {
      const res = NextResponse.redirect(new URL('/dashboard', request.url))
      applySecurityHeaders(res, nonce, isDev)
      return res
    }
    const reqHeaders = new Headers(request.headers)
    reqHeaders.set('x-nonce', nonce)
    const res = NextResponse.next({ request: { headers: reqHeaders } })
    applySecurityHeaders(res, nonce, isDev)
    return res
  }

  if (!token) {
    const cb = isSafeRelativePath(pathname) ? pathname : '/dashboard'
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', cb)
    const res = NextResponse.redirect(loginUrl)
    applySecurityHeaders(res, nonce, isDev)
    return res
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    const res = NextResponse.redirect(new URL('/403', request.url))
    applySecurityHeaders(res, nonce, isDev)
    return res
  }

  // Forward the nonce to the route so server components can use it.
  const reqHeaders = new Headers(request.headers)
  reqHeaders.set('x-nonce', nonce)
  const res = NextResponse.next({ request: { headers: reqHeaders } })
  applySecurityHeaders(res, nonce, isDev)
  return res
}

function applySecurityHeaders(res: NextResponse, nonce: string, isDev: boolean): void {
  res.headers.set('x-nonce', nonce)
  res.headers.set('Content-Security-Policy', buildCsp(nonce, isDev))
}

export const config = {
  matcher: [
    // Everything except Next internals, public assets, and image optimizer.
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|assets/).*)',
  ],
}
