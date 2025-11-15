/**
 * Logger utility untuk logging yang aman di production.
 * Hanya menampilkan log di development mode untuk menghindari eksposisi informasi sensitif.
 * Error selalu di-log karena penting untuk debugging.
 * 
 * @example
 * ```ts
 * logger.log('Debug info') // Hanya di development
 * logger.error('Critical error') // Selalu di-log
 * logger.warn('Warning') // Hanya di development
 * ```
 */
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but format them
    console.error('[ERROR]', ...args)
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },
}
