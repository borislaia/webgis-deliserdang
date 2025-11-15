/**
 * User roles yang tersedia di sistem.
 * 
 * - ADMIN: Administrator dengan akses penuh
 * - USER: User biasa dengan akses terbatas (read-only untuk data)
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const

/**
 * Type untuk role yang valid di sistem.
 */
export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Memvalidasi apakah string adalah role yang valid.
 * 
 * @param role - String yang akan divalidasi
 * @returns true jika role valid, false jika tidak
 * 
 * @example
 * ```ts
 * if (isValidRole(inputRole)) {
 *   // TypeScript akan tahu bahwa inputRole adalah Role
 *   updateUserRole(userId, inputRole)
 * }
 * ```
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role)
}
