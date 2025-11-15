/**
 * User-friendly error messages untuk ditampilkan ke user.
 * Semua pesan error dalam bahasa Indonesia untuk konsistensi UX.
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Koneksi internet bermasalah. Silakan coba lagi.',
  UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  NOT_FOUND: 'Data yang Anda cari tidak ditemukan.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  INVALID_CREDENTIALS: 'Email atau kata sandi salah.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui.',
} as const

/**
 * Mengkonversi error object menjadi pesan error yang user-friendly.
 * 
 * @param error - Error object (bisa Error instance, string, atau object lainnya)
 * @param fallback - Pesan fallback jika error tidak dapat di-parse (opsional)
 * @returns Pesan error yang user-friendly dalam bahasa Indonesia
 * 
 * @example
 * ```ts
 * try {
 *   await someOperation()
 * } catch (error) {
 *   const message = getErrorMessage(error, 'Terjadi kesalahan')
 *   showToast(message)
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_MESSAGES.UNAUTHORIZED
    }
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_MESSAGES.NOT_FOUND
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION_ERROR
    }
    
    return error.message || fallback || ERROR_MESSAGES.UNKNOWN_ERROR
  }
  
  return fallback || ERROR_MESSAGES.UNKNOWN_ERROR
}
