import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Next.js server helpers to avoid real Next runtime
vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: () => ({ __type: 'next' as const }),
      redirect: (url: any) => ({ __type: 'redirect' as const, url }),
    },
  }
})

// Mock Supabase auth helper used in middleware
const getSessionMock = vi.fn()
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: () => ({
    auth: { getSession: getSessionMock },
  }),
}))

// Import after mocks
import { middleware } from '../middleware'

describe('middleware auth redirect', () => {
  beforeEach(() => {
    getSessionMock.mockReset()
  })

  function makeReq(path: string) {
    const u = new URL('https://example.com' + path)
    const nextUrl = {
      pathname: u.pathname,
      search: u.search,
      searchParams: new URLSearchParams(u.search),
      clone() {
        const c = new URL('https://example.com' + this.pathname + (this.search || ''))
        return {
          pathname: c.pathname,
          search: c.search,
          searchParams: new URLSearchParams(c.search),
        }
      },
    }
    return { nextUrl } as any
  }

  it('redirects unauthenticated user from /dashboard to /login with redirect param', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const res: any = await middleware(makeReq('/dashboard'))

    expect(res.__type).toBe('redirect')
    expect(res.url.pathname).toBe('/login')
    expect(res.url.searchParams.get('redirect')).toBe(encodeURIComponent('/dashboard'))
  })

  it('allows authenticated user to access /map/*', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const res: any = await middleware(makeReq('/map/area?x=1'))

    expect(res.__type).toBe('next')
  })
})
