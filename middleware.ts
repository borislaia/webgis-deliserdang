import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Bypass auth saat Preview (Vercel) atau ketika flag eksplisit diaktifkan
  if (process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // AUTH LOGIC
  if (pathname === '/login') {
    if (user) {
      const redirectTarget = request.nextUrl.searchParams.get('redirect')
      if (redirectTarget) {
        // Basic safety check: ensure redirect starts with / but not //
        const decoded = decodeURIComponent(redirectTarget)
        if (decoded.startsWith('/') && !decoded.startsWith('//')) {
          return NextResponse.redirect(new URL(decoded, request.url))
        }
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  if (pathname.startsWith('/map') || pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const fullPathWithQuery = `${request.nextUrl.pathname}${request.nextUrl.search}`
      url.searchParams.set('redirect', encodeURIComponent(fullPathWithQuery))
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/map/:path*', '/dashboard/:path*', '/login']
}
