import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'
import { createClient } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Initialize Supabase client and refresh session cookies
  const response = createClient(request)

  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith('/admin') && path !== '/admin/login'

  if (isAdminRoute) {
    const sessionToken = request.cookies.get('session')?.value
    let session = null
    
    if (sessionToken) {
      try {
        session = await decrypt(sessionToken)
      } catch (err) {
        // invalid token
      }
    }

    if (!session) {
      const redirectUrl = new URL('/admin/login', request.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      // Transfer Supabase cookies to redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    if (session.role !== 'ADMIN') {
      const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

