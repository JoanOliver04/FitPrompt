import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import Script from 'next/script'
import Providers from '@/components/layout/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FitPrompt — Tu entrenador IA personal',
    template: '%s | FitPrompt',
  },
  description:
    'Rutinas y dietas 100% personalizadas generadas por IA según tu cuerpo, objetivos y disponibilidad.',
  keywords: ['fitness', 'entrenamiento', 'dieta', 'inteligencia artificial', 'rutinas personalizadas'],
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'FitPrompt — Tu entrenador IA personal',
    description: 'Rutinas y dietas 100% personalizadas generadas por IA.',
    images: [{ url: '/icon.png' }],
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#101010',
  colorScheme: 'dark',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="es" className="dark">
      <head>
        <Script
          id="fp-theme-bootstrap"
          strategy="beforeInteractive"
          nonce={nonce}
        >
          {`try{var t=localStorage.getItem('fp-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');}catch(e){}`}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans bg-bg-primary text-text-primary min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
