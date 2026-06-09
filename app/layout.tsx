import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* No-flash theme: the script is the single source of truth for the
            `dark` class. We deliberately do NOT hardcode className="dark" on
            <html> — the App Router re-applies the server shell's attributes to
            the singleton <html>/<body> on router.refresh()/navigation, which
            would otherwise wipe a client switch to light mode. Defaults to dark
            when no preference (or on error) is stored. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var c=document.documentElement.classList;if(localStorage.getItem('fp-theme')==='light')c.remove('dark');else c.add('dark');}catch(e){document.documentElement.classList.add('dark');}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-sans bg-bg-primary text-text-primary min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
