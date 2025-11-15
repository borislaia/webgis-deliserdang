import { resolveSafeRedirect } from '../redirect'

describe('resolveSafeRedirect', () => {
  it('should return fallback for null input', () => {
    expect(resolveSafeRedirect(null)).toBe('/dashboard')
    expect(resolveSafeRedirect(undefined)).toBe('/dashboard')
  })

  it('should return fallback for invalid path', () => {
    expect(resolveSafeRedirect('//evil.com')).toBe('/dashboard')
    expect(resolveSafeRedirect('http://evil.com')).toBe('/dashboard')
    expect(resolveSafeRedirect('https://evil.com')).toBe('/dashboard')
  })

  it('should return valid path', () => {
    expect(resolveSafeRedirect('/map')).toBe('/map')
    expect(resolveSafeRedirect('/dashboard')).toBe('/dashboard')
    expect(resolveSafeRedirect('/map?di=123')).toBe('/map?di=123')
  })

  it('should decode URL encoded paths', () => {
    expect(resolveSafeRedirect('/map%3Fdi%3D123')).toBe('/map?di=123')
    expect(resolveSafeRedirect('/dashboard%2Fsettings')).toBe('/dashboard/settings')
  })

  it('should use custom fallback', () => {
    expect(resolveSafeRedirect(null, '/home')).toBe('/home')
    expect(resolveSafeRedirect('//evil.com', '/home')).toBe('/home')
  })

  it('should handle invalid encoding gracefully', () => {
    // Invalid encoding should return fallback
    expect(resolveSafeRedirect('%E0%A4%A')).toBe('/dashboard')
  })
})
