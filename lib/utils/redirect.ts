/**
 * Resolves a safe redirect URL from query parameter.
 * Prevents open redirect vulnerabilities by validating that the redirect path
 * starts with '/' and doesn't start with '//' (which could be protocol-relative).
 * 
 * @param raw - Raw redirect parameter from URL query string (can be URL encoded)
 * @param fallback - Default redirect path if raw is null, undefined, or invalid (default: '/dashboard')
 * @returns Safe redirect path that starts with '/' and is safe to use
 * 
 * @example
 * ```ts
 * // Valid redirects
 * resolveSafeRedirect('/map') // Returns '/map'
 * resolveSafeRedirect('/dashboard?tab=users') // Returns '/dashboard?tab=users'
 * resolveSafeRedirect('/map%3Fdi%3D123') // Returns '/map?di=123' (decoded)
 * 
 * // Invalid redirects (returns fallback)
 * resolveSafeRedirect('//evil.com') // Returns '/dashboard'
 * resolveSafeRedirect('http://evil.com') // Returns '/dashboard'
 * resolveSafeRedirect(null) // Returns '/dashboard'
 * ```
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
