import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

/**
 * Fetcher function untuk SWR - Ruas
 */
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ruas')
    .select('id,no_ruas,urutan,panjang')
    .order('urutan', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * Custom hook untuk fetch ruas dengan SWR caching.
 * 
 * Data di-cache dan akan di-revalidate otomatis saat reconnect atau manual mutate.
 * 
 * @returns Object dengan:
 * - data: Array of ruas (default: [])
 * - isLoading: Loading state
 * - error: Error object jika terjadi error
 * - mutate: Function untuk manual revalidation
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useRuas()
 * ```
 */
export function useRuas() {
  const { data, error, isLoading, mutate } = useSWR(
    'ruas',
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
