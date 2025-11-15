/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
  ok: boolean
}

/**
 * User response from API
 */
export interface UserResponse {
  id: string
  email: string
  role: string
  created_at: string | null
  last_sign_in_at: string | null
}
