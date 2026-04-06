import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow auth routes to pass through, as they are in the matcher
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // For all other matched routes, check for a token.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL(`/login`, req.url)
    url.searchParams.set('callbackUrl', pathname) // Use pathname to avoid long URLs
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/league/:path*',
    '/api/leagues/:path*',
    '/api/teams/:path*',
    '/api/rosters/:path*',
    '/api/freeagency/:path*',
    '/api/auth/:path*', // Keep this so we can explicitly allow it
  ],
}
