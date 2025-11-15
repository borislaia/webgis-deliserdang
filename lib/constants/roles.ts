/**
 * User roles in the system
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role)
}
