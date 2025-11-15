import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveSafeRedirect } from '@/lib/utils/redirect'

/**
 * GET /auth/callback
 * 
 * Menangani OAuth redirect dari Supabase dan menyimpan auth cookies.
 * Setelah OAuth flow selesai, user akan di-redirect ke halaman yang diminta.
 * 
 * @param request - Request object dengan query parameter 'code' (OAuth code) dan 'redirect' (optional)
 * @returns Redirect response ke halaman yang diminta atau dashboard default
 * 
 * @example
 * URL: /auth/callback?code=oauth_code&redirect=/map
 * Result: User di-authenticate dan di-redirect ke /map
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect')

  const redirect = resolveSafeRedirect(rawRedirect)

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirect, origin))
}

/**
 * POST /auth/callback
 * 
 * Memungkinkan client-side password logins untuk menyimpan session di httpOnly cookies.
 * Dipanggil dari client saat user login dengan email/password untuk sync session ke server.
 * 
 * @param request - Request object dengan body: { event: 'SIGNED_IN' | 'TOKEN_REFRESHED' | 'SIGNED_OUT', session: Session | null }
 * @returns JSON response dengan { ok: boolean, error?: string }
 * 
 * @example
 * ```ts
 * await fetch('/auth/callback', {
 *   method: 'POST',
 *   body: JSON.stringify({ event: 'SIGNED_IN', session: sessionData })
 * })
 * ```
 */
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
  const { event, session } = await request.json().catch(() => ({ event: null, session: null }))

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Session tidak ditemukan' }, { status: 400 })
    }
    const { error } = await supabase.auth.setSession(session)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message || 'Gagal menyimpan sesi' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: 'Event tidak didukung' }, { status: 400 })
}
