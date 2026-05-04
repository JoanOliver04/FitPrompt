import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderShoppingListDocument } from '@/components/pdf/ShoppingListDocument'
import type { ShoppingListCategory } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const categories = (body as Record<string, unknown>)?.categories
  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: 'categories must be a non-empty array' }, { status: 400 })
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderShoppingListDocument(categories as ShoppingListCategory[])
  } catch (err) {
    console.error('[shopping-list-pdf]', err)
    return NextResponse.json({ error: 'Error generando el PDF.' }, { status: 500 })
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="lista-compra-fitprompt.pdf"',
      'Content-Length':      String(pdfBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}
