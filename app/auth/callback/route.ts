import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Handles OAuth callback from Supabase: exchanges the code and sets cookies, then redirects.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirect') || '/map'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    // This will set the auth cookies for the current domain
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirect, req.url))
}

// Allows client-side email/password login to set HTTP-only cookies on the server.
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await req.json().catch(() => null as any)

  const access_token = body?.access_token ?? body?.session?.access_token
  const refresh_token = body?.refresh_token ?? body?.session?.refresh_token

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
  }

  await supabase.auth.setSession({ access_token, refresh_token })
  return NextResponse.json({ ok: true })
}
