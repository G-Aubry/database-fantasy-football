/*
 * Copyright 2026 Grant Aubry
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
