import { hash } from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser) {
      return Response.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 10)

    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
      },
    })

    return Response.json(
      { message: 'User created successfully', userId: user.user_id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
