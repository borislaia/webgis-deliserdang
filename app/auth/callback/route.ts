import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Handles OAuth redirect from Supabase and sets auth cookies
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirect = searchParams.get('redirect')

  function resolveSafeRedirect(raw: string | null | undefined, fallback = '/dashboard') {
    if (!raw) return fallback
    let decoded = raw
    try { decoded = decodeURIComponent(raw) } catch {}
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback
    return decoded
  }

  const redirect = resolveSafeRedirect(rawRedirect)

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirect, origin))
}

// Allows client-side password logins to persist session in httpOnly cookies
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
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
