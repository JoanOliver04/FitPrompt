/**
 * Promote an existing user to ADMIN role.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts <email>
 *
 * Example:
 *   npx tsx scripts/make-admin.ts joanvicentoliverrosell@gmail.com
 */

import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

loadEnvConfig(process.cwd())

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('✗ DATABASE_URL is not set. Check your .env.local file.')
  process.exit(1)
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function makeAdmin(email: string) {
  const user = await db.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`✗ No user found with email: ${email}`)
    process.exit(1)
  }

  if (user.role === 'ADMIN') {
    console.log(`ℹ  ${email} is already ADMIN`)
    return
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  })

  console.log(`✓ ${email} is now ADMIN`)
}

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

makeAdmin(email)
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
