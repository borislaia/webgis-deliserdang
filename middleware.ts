import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTenantFromHostname } from './lib/tenant-config'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Detect Tenant
  const hostname = request.headers.get('host') || 'localhost:3000'
  const tenantUptd = getTenantFromHostname(hostname)

  // 2. Set Cookie for Client/Server Components to use
  response.cookies.set('tenant_uptd', tenantUptd)

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

  // Only protect /dashboard, allow /map to be public
  if (pathname.startsWith('/dashboard')) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
