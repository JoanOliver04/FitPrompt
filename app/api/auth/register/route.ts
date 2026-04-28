import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { findUserByEmail, createUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string }
    const { name, email, password } = body

    // Validaciones servidor — no confiar solo en el cliente
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'El email no es válido' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }
    if (findUserByEmail(email.toLowerCase())) {
      return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)

    createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword,
      image: null,
      plan: 'free',
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
