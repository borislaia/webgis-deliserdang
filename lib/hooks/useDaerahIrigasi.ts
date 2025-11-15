import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

/**
 * Fetcher function untuk SWR - Daerah Irigasi.
 * Mengambil semua data daerah irigasi dari Supabase.
 */
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daerah_irigasi')
    .select('id,k_di,n_di,luas_ha,kecamatan,desa_kel,sumber_air,tahun_data')
    .order('k_di', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * Custom hook untuk fetch daerah irigasi dengan SWR caching.
 * 
 * @returns Object dengan data, loading state, dan error
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDaerahIrigasi()
 * ```
 */
/**
 * Custom hook untuk fetch daerah irigasi dengan SWR caching.
 * 
 * Data di-cache dan akan di-revalidate otomatis saat:
 * - Koneksi kembali (reconnect)
 * - Manual mutate dipanggil
 * 
 * Tidak akan revalidate saat window focus untuk menghemat API calls.
 * 
 * @returns Object dengan:
 * - data: Array of daerah irigasi (default: [])
 * - isLoading: Loading state
 * - error: Error object jika terjadi error
 * - mutate: Function untuk manual revalidation
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, mutate } = useDaerahIrigasi()
 * 
 * if (isLoading) return <Loading />
 * if (error) return <Error message={error.message} />
 * 
 * return <DaerahIrigasiList data={data} />
 * ```
 */
export function useDaerahIrigasi() {
  const { data, error, isLoading, mutate } = useSWR(
    'daerah-irigasi',
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
    mutate, // Untuk manual revalidation
  }
}
