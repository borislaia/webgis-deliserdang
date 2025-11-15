import { SWRConfiguration } from 'swr'

/**
 * Default SWR configuration untuk aplikasi
 * 
 * - revalidateOnFocus: false - Tidak revalidate saat window focus (menghemat API calls)
 * - revalidateOnReconnect: true - Revalidate saat koneksi kembali
 * - dedupingInterval: 2000 - Dedupe requests dalam 2 detik
 * - errorRetryCount: 3 - Retry maksimal 3 kali jika error
 * - errorRetryInterval: 5000 - Retry setiap 5 detik
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error) => {
    // Log error untuk debugging (hanya di development)
    if (process.env.NODE_ENV === 'development') {
      console.error('SWR Error:', error)
    }
  },
}
