/**
 * Resolves a safe redirect URL from query parameter
 * Prevents open redirect vulnerabilities
 * 
 * @param raw - Raw redirect parameter from URL
 * @param fallback - Default redirect if raw is invalid
 * @returns Safe redirect path
 */
export function resolveSafeRedirect(
  raw: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!raw) return fallback
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // Invalid encoding, use fallback
    return fallback
  }
  // Prevent open redirect attacks
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback
  }
  return decoded
}
