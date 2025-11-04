import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function ensureAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  if (!user || ((user.app_metadata as any)?.role !== 'admin' && (user.user_metadata as any)?.role !== 'admin')) {
    return { user: null }
  }
  return { user }
}

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET() {
  try {
    const { user } = await ensureAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = getAdminClient()
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) throw error

    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      role: (u.app_metadata as any)?.role || (u.user_metadata as any)?.role || 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    const message = error?.message || 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: error?.status || 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await ensureAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const id = body?.id
    const role = (body?.role || '').toString().trim()
    if (!id || !role) {
      return NextResponse.json({ error: 'id dan role wajib diisi' }, { status: 400 })
    }
    if (id === user.id) {
      return NextResponse.json({ error: 'Admin tidak dapat mengubah role sendiri' }, { status: 403 })
    }
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const { data, error } = await adminClient.auth.admin.updateUserById(id, {
      app_metadata: { role },
      user_metadata: { ...(body?.user_metadata || {}), role },
    })
    if (error) throw error

    return NextResponse.json({ ok: true, user: data?.user })
  } catch (error: any) {
    const message = error?.message || 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: error?.status || 500 })
  }
}
