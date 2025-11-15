import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { ROLES } from '@/lib/constants/roles'
import type { AppMetadata, UserMetadata } from '@/lib/types/user'
import type { UserResponse } from '@/lib/types/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function ensureAdmin() {
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  
  if (!user) {
    return { user: null }
  }
  
  const appMetadata = user.app_metadata as AppMetadata
  const userMetadata = user.user_metadata as UserMetadata
  const role = appMetadata?.role || userMetadata?.role
  
  if (role !== ROLES.ADMIN) {
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

    const users: UserResponse[] = (data?.users || []).map((u) => {
      const appMetadata = u.app_metadata as AppMetadata
      const userMetadata = u.user_metadata as UserMetadata
      return {
        id: u.id,
        email: u.email || '',
        role: appMetadata?.role || userMetadata?.role || ROLES.USER,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const status = error && typeof error === 'object' && 'status' in error 
      ? (error.status as number) 
      : 500
    return NextResponse.json({ error: message }, { status })
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
    if (!Object.values(ROLES).includes(role as typeof ROLES[keyof typeof ROLES])) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const { data: existing, error: fetchError } = await adminClient.auth.admin.getUserById(id)
    if (fetchError) throw fetchError

    const targetUser = existing?.user
    if (!targetUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }
    
    const targetAppMetadata = targetUser.app_metadata as AppMetadata
    const targetUserMetadata = targetUser.user_metadata as UserMetadata
    const targetRole = targetAppMetadata?.role || targetUserMetadata?.role || ROLES.USER

    if (targetRole === ROLES.ADMIN && id !== user.id && role !== targetRole) {
      return NextResponse.json({ error: 'Anda tidak dapat mengubah role admin lain' }, { status: 403 })
    }

    if (role === targetRole) {
      return NextResponse.json({ ok: true, user: targetUser })
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(id, {
      app_metadata: { role },
      user_metadata: { ...(body?.user_metadata || {}), role },
    })
    if (error) throw error

    return NextResponse.json({ ok: true, user: data?.user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const status = error && typeof error === 'object' && 'status' in error 
      ? (error.status as number) 
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
