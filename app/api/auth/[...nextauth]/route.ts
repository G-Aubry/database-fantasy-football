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

import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user?: {
      id?: string
    } & DefaultSession['user']
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Invalid credentials');
        }
        try {
          const user = await prisma.users.findUnique({
            where: { username: credentials.username as string },
          });
          if (!user) {
            throw new Error('Invalid credentials'); 
          }
          const isPasswordValid = await compare(credentials.password as string, user.password_hash);
          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }
          return {
            id: user.user_id.toString(),
            name: user.username,
            email: user.email,
          };
        } catch (error: any) {
          console.error("AUTH_DATABASE_ERROR:", error.message);
          throw new Error('Authentication service is currently unavailable.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60, // 1 hour
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

async function auth(req: NextRequest, ctx: any) {
  const cookieStore = await cookies()
  const rememberMe = cookieStore.get('rememberMe')?.value === 'true'

  const useSecureCookies = req.nextUrl?.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const cookiePrefix = useSecureCookies ? '__Secure-' : ''
  const sessionTokenName = `${cookiePrefix}next-auth.session-token`

  const customAuthOptions: NextAuthOptions = {
    ...authOptions,
    session: {
      strategy: 'jwt',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 60 * 60, // 30 days or 1 hour idle timeout
      updateAge: rememberMe ? undefined : 15 * 60, //Update session every 15 minutes
    },
  }

  const handler = NextAuth(customAuthOptions)
  return handler(req as any, ctx)
}

export { auth as GET, auth as POST }
