# FitPrompt — Guía para Claude Code

## Descripción del Proyecto
FitPrompt es una app web de fitness con IA que genera rutinas y dietas personalizadas.
Tiene un plan gratuito (Free) y uno de pago (Fit Premium).

## Stack Tecnológico
- **Framework:** Next.js 15 con App Router
- **Lenguaje:** TypeScript (strict mode, sin `any`)
- **Estilos:** TailwindCSS v3 (modo oscuro por defecto, clase `dark` en `<html>`)
- **IA Free:** Groq API — modelo `llama3-70b-8192` (cliente en `lib/groq.ts`)
- **IA Premium:** Anthropic Claude — modelo `claude-sonnet-4-6` (cliente en `lib/anthropic.ts`)
- **Auth:** NextAuth.js (Google OAuth + email/password)
- **DB:** PostgreSQL via Supabase + Prisma ORM (esquema en `prisma/schema.prisma`)
- **Pagos:** Stripe
- **Deploy:** Vercel (frontend) + Supabase (DB)

## Paleta de Colores Oficial
| Token           | Valor     | Uso                          |
|-----------------|-----------|------------------------------|
| `--bg-primary`  | `#101010` | Fondo principal              |
| `--accent`      | `#FF471A` | Botones, CTAs, highlights    |
| `--text-primary`| `#FFFFFF` | Texto principal              |
| `--text-secondary`| `#E0E0E0`| Texto secundario, bordes    |

## Estructura de Carpetas
```
app/
├── (auth)/           → login, register (rutas públicas)
├── (dashboard)/      → rutas protegidas (requieren sesión)
│   ├── dashboard/
│   ├── chat/[id]/
│   ├── profile/
│   └── settings/
├── onboarding/       → formulario inicial post-registro
└── api/              → API Routes de Next.js
    ├── auth/
    ├── user/
    ├── chat/
    ├── ai/
    └── stripe/
components/
├── ui/               → Button, Input, Card, Modal…
├── layout/           → Sidebar, Header, BottomNav
├── chat/             → ChatInterface, MessageBubble…
└── dashboard/        → StatsCard, WeekCalendar…
lib/                  → groq.ts, anthropic.ts, auth.ts, utils.ts, prompts.ts
types/                → index.ts (interfaces globales)
hooks/                → useAuth, useLocalStorage…
store/                → estado global
prisma/               → schema.prisma
```

## Convenciones de Código
- Componentes en PascalCase, archivos en kebab-case para utilidades
- Server Components por defecto; añadir `'use client'` solo cuando sea necesario
- Nunca usar `any` — tipar todo en `types/index.ts`
- Rutas protegidas: middleware en `middleware.ts` que redirige a `/login` si no hay sesión
- Límites del plan siempre validados en **backend** (nunca solo en frontend)

## Variables de Entorno Requeridas
Ver `.env.local.example` en la raíz del proyecto.

## Planes y Límites
| Feature              | Free       | Premium         |
|----------------------|------------|-----------------|
| Mensajes/día         | 5          | Ilimitados      |
| Chats guardados      | 3          | Ilimitados      |
| Gráficas de progreso | ✗          | ✓               |
| Grupos sociales      | ✗          | ✓               |
| Badges               | 4 primeros | Todos           |
