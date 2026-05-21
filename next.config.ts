import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'Strict-Transport-Security',          value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',                    value: 'DENY' },
  { key: 'X-Content-Type-Options',             value: 'nosniff' },
  { key: 'Referrer-Policy',                    value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',                 value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy',         value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy',       value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control',             value: 'on' },
  { key: 'X-Permitted-Cross-Domain-Policies',  value: 'none' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
