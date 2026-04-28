# FitPrompt

App web de fitness con IA que genera rutinas y dietas personalizadas.

## Stack
- Next.js 15 (App Router) + TypeScript
- TailwindCSS v3 (modo oscuro por defecto)
- Groq API (IA plan Free) + Anthropic Claude (IA plan Premium)
- PostgreSQL via Supabase + Prisma
- NextAuth.js + Stripe

## Arrancar el proyecto

```bash
npm install
cp .env.local.example .env.local
# → Rellena las variables en .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page pública |
| `/login` | Iniciar sesión |
| `/register` | Crear cuenta |
| `/onboarding` | Formulario inicial (5 pasos) |
| `/dashboard` | Panel principal |
| `/chat` | Lista de chats |
| `/chat/[id]` | Chat con la IA |
| `/profile` | Perfil del usuario |

## Fases de desarrollo
Ver `fitprompt_drive/index_fases/fitprompt_index_fases.txt`
