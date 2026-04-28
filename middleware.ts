// middleware.ts — Protección de rutas del dashboard
//
// withAuth redirige a /login si el usuario no tiene sesión JWT válida.
// Las rutas públicas (/, /login, /register, /api/auth/*) no están en el matcher
// y por tanto nunca llegan a este middleware.

import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/onboarding',
  ],
}
