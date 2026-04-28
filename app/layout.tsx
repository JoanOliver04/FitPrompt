import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans bg-[#101010] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
