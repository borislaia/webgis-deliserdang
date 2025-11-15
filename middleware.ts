import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { resolveSafeRedirect } from '@/lib/utils/redirect'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const { pathname } = req.nextUrl

  // Bypass auth hanya untuk preview dengan secret token (server-only, tidak diekspos ke client)
  // Hapus NEXT_PUBLIC_BYPASS_AUTH dari environment variables karena dapat diekspos ke client
  const bypassAuth = process.env.BYPASS_AUTH === 'true' // Server-only variable
  if (process.env.VERCEL_ENV === 'preview' && bypassAuth) {
    const previewToken = req.nextUrl.searchParams.get('preview_token')
    if (previewToken === process.env.PREVIEW_SECRET_TOKEN) {
      return response
    }
  }

  // Create Supabase client with SSR support
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed and get it
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (pathname === '/login') {
    if (session) {
      const redirectTarget = resolveSafeRedirect(req.nextUrl.searchParams.get('redirect'), '/dashboard')
      const redirectUrl = new URL(redirectTarget, req.nextUrl.origin)
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }

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
  matcher: ['/map/:path*', '/dashboard/:path*', '/login']
}
