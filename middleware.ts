import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Bypass auth saat Preview (Vercel) atau ketika flag eksplisit diaktifkan
  if (process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return res
  }

  // Refresh session if needed and get it
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (pathname.startsWith('/map') || pathname.startsWith('/dashboard')) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      // Preserve full path + query so we can return to the exact map view after login
      const fullPathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search}`
      url.searchParams.set('redirect', encodeURIComponent(fullPathWithQuery))
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/map/:path*', '/dashboard/:path*']
}
