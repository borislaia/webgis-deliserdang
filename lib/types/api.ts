/**
 * Standard API response format untuk konsistensi di seluruh aplikasi.
 * 
 * @template T - Type dari data yang dikembalikan
 * 
 * @example
 * ```ts
 * const response: ApiResponse<User[]> = {
 *   ok: true,
 *   data: [user1, user2]
 * }
 * ```
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
  ok: boolean
}

/**
 * User response dari API /api/admin/users.
 * Berisi informasi user yang dikembalikan dari endpoint admin.
 */
export interface UserResponse {
  id: string
  email: string
  role: string
  created_at: string | null
  last_sign_in_at: string | null
}
