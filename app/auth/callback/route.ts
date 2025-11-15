import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { resolveSafeRedirect } from '@/lib/utils/redirect'

// Handles OAuth redirect from Supabase and sets auth cookies
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

// Allows client-side password logins to persist session in httpOnly cookies
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
