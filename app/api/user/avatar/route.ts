import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PREDEFINED_AVATARS, MAX_UPLOAD_BYTES } from '@/lib/avatars'
import type { Plan } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ image: null })
  const row = await db.user.findUnique({ where: { id: session.user.id }, select: { image: true } })
  return NextResponse.json({ image: row?.image ?? null })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const image = (body as Record<string, unknown>)?.image
  if (typeof image !== 'string' || !image.trim()) {
    return NextResponse.json({ error: 'image is required' }, { status: 400 })
  }

  const plan = (session.user as { plan?: Plan }).plan ?? 'free'

  if (plan === 'free') {
    if (!PREDEFINED_AVATARS.includes(image)) {
      return NextResponse.json({ error: 'El plan gratuito solo permite avatares predefinidos' }, { status: 403 })
    }
  } else {
    // Premium: predefined OR base64 data URL OR https URL
    const isValid =
      PREDEFINED_AVATARS.includes(image) ||
      image.startsWith('data:image/') ||
      image.startsWith('https://')
    if (!isValid) return NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 })
    if (image.length > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx ~200 KB)' }, { status: 400 })
    }
  }

  await db.user.update({ where: { id: session.user.id }, data: { image } })

  return NextResponse.json({ ok: true, image })
}
