// types/global.d.ts — Declaraciones globales de tipos

// ─── Variables de entorno tipadas ─────────────────────────────────────────────
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test'
    readonly NEXTAUTH_URL: string
    readonly NEXTAUTH_SECRET: string
    readonly GOOGLE_CLIENT_ID: string
    readonly GOOGLE_CLIENT_SECRET: string
    readonly DATABASE_URL: string
    readonly GROQ_API_KEY: string
    readonly ANTHROPIC_API_KEY?: string
    readonly STRIPE_SECRET_KEY?: string
    readonly STRIPE_PUBLISHABLE_KEY?: string
    readonly STRIPE_WEBHOOK_SECRET?: string
  }
}

// ─── Tipos de utilidad globales ────────────────────────────────────────────────

/** Hace T nullable */
type Nullable<T> = T | null

/** Hace todas las props de T opcionales de forma profunda */
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/** Extrae el tipo de los elementos de un array */
type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never

/** Tipo para los parámetros de rutas dinámicas en Next.js 15 */
type PageParams<T extends Record<string, string>> = {
  params: Promise<T>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}
