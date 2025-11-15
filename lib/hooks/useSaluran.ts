import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

/**
 * Fetcher function untuk SWR - Saluran
 */
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saluran')
    .select('id,no_saluran,nama,jenis,panjang_total,luas_layanan,urutan')
    .order('urutan', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * Custom hook untuk fetch saluran dengan SWR caching.
 * 
 * Data di-cache dan akan di-revalidate otomatis saat reconnect atau manual mutate.
 * 
 * @returns Object dengan:
 * - data: Array of saluran (default: [])
 * - isLoading: Loading state
 * - error: Error object jika terjadi error
 * - mutate: Function untuk manual revalidation
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useSaluran()
 * ```
 */
export function useSaluran() {
  const { data, error, isLoading, mutate } = useSWR(
    'saluran',
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
