/**
 * Environment variable validation untuk memastikan semua required variables sudah di-set.
 * File ini memvalidasi environment variables yang diperlukan saat aplikasi startup.
 * 
 * @throws Error jika ada environment variable yang missing
 */
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

/**
 * Memvalidasi bahwa semua required environment variables sudah di-set.
 * Sebaiknya dipanggil saat aplikasi startup untuk fail-fast jika ada konfigurasi yang kurang.
 * 
 * @throws Error dengan daftar environment variables yang missing
 * 
 * @example
 * ```ts
 * // Di app startup
 * validateEnv()
 * ```
 */
export function validateEnv() {
  const missing: string[] = []

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file or environment configuration.'
    )
  }
}

/**
 * Mengambil environment variables yang sudah divalidasi.
 * Memanggil validateEnv() terlebih dahulu sebelum mengembalikan values.
 * 
 * @returns Object dengan environment variables yang sudah divalidasi
 * @throws Error jika ada environment variable yang missing
 * 
 * @example
 * ```ts
 * const env = getEnv()
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 * ```
 */
export function getEnv() {
  validateEnv()
  return {
    NEXT_PUBLIC_SUPABASE_URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
  }
}
