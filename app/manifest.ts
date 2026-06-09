import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitPrompt — Tu entrenador IA',
    short_name: 'FitPrompt',
    description: 'Rutinas y dietas 100% personalizadas generadas por IA según tu cuerpo y objetivos.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#101010',
    theme_color: '#101010',
    orientation: 'portrait-primary',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Chat con FitCoach',
        short_name: 'Chat',
        description: 'Habla con tu entrenador IA',
        url: '/chat/new',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
      {
        name: 'Registrar entreno',
        short_name: 'Entreno',
        description: 'Registra tu sesión de hoy',
        url: '/tracking',
        icons: [{ src: '/icon.png', sizes: '96x96' }],
      },
    ],
  }
}
