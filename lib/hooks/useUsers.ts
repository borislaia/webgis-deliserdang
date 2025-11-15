import useSWR from 'swr'
import type { UserResponse } from '@/lib/types/api'

/**
 * Fetcher function untuk SWR - Users (Admin only)
 */
const fetcher = async (url: string): Promise<UserResponse[]> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error || `Failed to fetch users (${res.status})`)
  }
  const json = await res.json()
  return Array.isArray(json.users) ? json.users : []
}

/**
 * Custom hook untuk fetch users dengan SWR caching.
 * Hanya untuk admin.
 * 
 * @param enabled - Apakah fetch harus dilakukan (default: true)
 * @returns Object dengan data, loading state, dan error
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useUsers(true)
 * ```
 */
export function useUsers(enabled: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/admin/users' : null, // null = tidak fetch
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    data: data || [],
    isLoading,
    error,
    mutate,
  }
}
