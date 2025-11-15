import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

/**
 * Fetcher function untuk SWR - Bangunan
 */
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bangunan')
    .select('id,nama,tipe,latitude,longitude,urutan_di_saluran')
    .order('urutan_di_saluran', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * Custom hook untuk fetch bangunan dengan SWR caching.
 * 
 * Data di-cache dan akan di-revalidate otomatis saat reconnect atau manual mutate.
 * 
 * @returns Object dengan:
 * - data: Array of bangunan (default: [])
 * - isLoading: Loading state
 * - error: Error object jika terjadi error
 * - mutate: Function untuk manual revalidation
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useBangunan()
 * ```
 */
export function useBangunan() {
  const { data, error, isLoading, mutate } = useSWR(
    'bangunan',
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
