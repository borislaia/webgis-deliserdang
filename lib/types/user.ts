/**
 * User metadata structure dari Supabase Auth.
 * Berisi informasi tambahan tentang user yang disimpan di user_metadata.
 */
export interface UserMetadata {
  full_name?: string
  name?: string
  username?: string
  avatar_url?: string
  picture?: string
  role?: string
}

/**
 * App metadata structure dari Supabase Auth.
 * Berisi informasi aplikasi tentang user, seperti role.
 * Biasanya digunakan untuk data yang tidak boleh diubah oleh user sendiri.
 */
export interface AppMetadata {
  role?: string
}

/**
 * Extended user type dengan typed metadata untuk type safety yang lebih baik.
 * 
 * @example
 * ```ts
 * const user: TypedUser = {
 *   id: 'user-id',
 *   email: 'user@example.com',
 *   user_metadata: { full_name: 'John Doe' },
 *   app_metadata: { role: 'admin' }
 * }
 * ```
 */
export interface TypedUser {
  id: string
  email?: string
  user_metadata: UserMetadata
  app_metadata: AppMetadata
}
