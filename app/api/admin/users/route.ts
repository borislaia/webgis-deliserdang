import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { ROLES } from '@/lib/constants/roles'
import type { AppMetadata, UserMetadata } from '@/lib/types/user'
import type { UserResponse } from '@/lib/types/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Memastikan user yang sedang login adalah admin.
 * 
 * @returns Object dengan user jika admin, atau { user: null } jika bukan admin
 * @throws Error jika terjadi kesalahan saat mengambil user
 */
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

/**
 * Membuat Supabase client dengan service role key untuk akses admin.
 * Service role key bypass RLS dan memiliki akses penuh ke database.
 * 
 * @returns Supabase client dengan service role
 * @throws Error jika environment variables tidak dikonfigurasi
 */
function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

/**
 * GET /api/admin/users
 * 
 * Mengambil daftar semua users dalam sistem.
 * Hanya dapat diakses oleh admin.
 * 
 * @returns JSON response dengan array of users
 * @throws 403 Forbidden jika user bukan admin
 * @throws 500 Internal Server Error jika terjadi kesalahan
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/admin/users')
 * const { users } = await response.json()
 * ```
 */
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
        last_sign_in_at: u.last_sign_in_at ?? null,
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

/**
 * PATCH /api/admin/users
 * 
 * Mengupdate role user dalam sistem.
 * Hanya dapat diakses oleh admin.
 * 
 * @param request - Request object dengan body: { id: string, role: 'admin' | 'user' }
 * @returns JSON response dengan updated user
 * @throws 400 Bad Request jika id atau role tidak valid
 * @throws 403 Forbidden jika user bukan admin atau mencoba mengubah role sendiri/admin lain
 * @throws 404 Not Found jika user tidak ditemukan
 * @throws 500 Internal Server Error jika terjadi kesalahan
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/admin/users', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ id: 'user-id', role: 'admin' })
 * })
 * ```
 */
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
