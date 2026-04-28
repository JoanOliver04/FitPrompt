// lib/db.ts — Singleton del cliente Prisma
//
// Preparado para Fase 02. Para activar:
//   1. npm install prisma @prisma/client
//   2. npx prisma init
//   3. Descomentar el código de abajo
//   4. Eliminar el export placeholder al final

// import { PrismaClient } from '@prisma/client'
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }
//
// export const db =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   })
//
// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = db
// }

// Placeholder — reemplazar cuando Prisma esté instalado
export const db = null as unknown as never
