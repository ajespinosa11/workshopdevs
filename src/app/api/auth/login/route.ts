import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.staffUser.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const hashedPassword = createHash('sha256').update(password).digest('hex')

    if (user.password_hash !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    const sessionToken = await encrypt({ id: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({ success: true, role: user.role })
    response.cookies.set('session', sessionToken, { expires, httpOnly: true, path: '/' })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
