# Panduan Quick Fixes - Masalah Kritis

Dokumen ini berisi langkah-langkah konkret untuk memperbaiki masalah kritis yang ditemukan dalam review.

---

## 1. Fix Hardcoded Supabase URL

### File: `next.config.mjs`

**Sebelum:**
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'yyagythhwzdncantoszf.supabase.co'
    }
  ]
}
```

**Sesudah:**
```javascript
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname 
  : 'yyagythhwzdncantoszf.supabase.co';

const nextConfig = {
  // ... existing config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname
      }
    ]
  }
};
```

---

## 2. Fix CORS Policy di Edge Function

### File: `supabase/functions/import-irrigation-data/index.ts`

**Sebelum:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
```

**Sesudah:**
```typescript
const getAllowedOrigin = (): string => {
  const origin = Deno.env.get('ALLOWED_ORIGIN');
  if (origin) return origin;
  
  // Fallback untuk development
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    return 'http://localhost:3000';
  }
  
  // Production: extract dari referer atau gunakan env
  return Deno.env.get('PRODUCTION_URL') || 'https://yourdomain.com';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Credentials': 'true',
};
```

**Tambahkan di Supabase Dashboard:**
- Set environment variable `ALLOWED_ORIGIN` untuk production
- Set `PRODUCTION_URL` jika diperlukan

---

## 3. Fix Bypass Auth Flag

### File: `middleware.ts`

**Sebelum:**
```typescript
if (process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
  return res
}
```

**Sesudah (Opsi 1 - Hapus Bypass):**
```typescript
// Hapus bypass untuk preview, gunakan test credentials
if (process.env.VERCEL_ENV === 'preview') {
  // Preview tetap memerlukan auth, tapi bisa menggunakan test account
  // atau skip hanya untuk specific preview URLs
  const previewToken = req.nextUrl.searchParams.get('preview_token');
  if (previewToken === process.env.PREVIEW_SECRET_TOKEN) {
    // Allow dengan token khusus
    return res;
  }
}
```

**Sesudah (Opsi 2 - Server-only Variable):**
```typescript
// Gunakan server-only variable (tidak diekspos ke client)
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true'; // Server-only

if (process.env.VERCEL_ENV === 'preview' && BYPASS_AUTH) {
  return res;
}
```

**Catatan:** Hapus `NEXT_PUBLIC_BYPASS_AUTH` dari semua environment variables karena `NEXT_PUBLIC_*` diekspos ke client.

---

## 4. Migrate dari Deprecated Auth Helpers

### Step 1: Install Package Baru
```bash
npm install @supabase/ssr
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-react
```

### Step 2: Update Client Helper
**File: `lib/supabase/client.ts`**

**Sebelum:**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()
```

**Sesudah:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 3: Update Server Helper
**File: `lib/supabase/server.ts`**

**Sebelum:**
```typescript
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export function createServerSupabase() {
  return createServerComponentClient({ cookies })
}
```

**Sesudah:**
```typescript
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Step 4: Update Middleware
**File: `middleware.ts`**

**Sebelum:**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  // ...
}
```

**Sesudah:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getSession()
  // ... rest of middleware logic
  return response
}
```

### Step 5: Update Route Handlers
**File: `app/api/admin/users/route.ts`**

**Sebelum:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

async function ensureAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  // ...
}
```

**Sesudah:**
```typescript
import { createServerClient } from '@supabase/ssr'

async function ensureAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  // ...
}
```

**File: `app/auth/callback/route.ts`**

**Sebelum:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  // ...
}
```

**Sesudah:**
```typescript
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
  // ...
}
```

---

## 5. Setup Basic Testing Infrastructure

### Step 1: Install Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### Step 2: Create `jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Step 3: Create `jest.setup.js`
```javascript
import '@testing-library/jest-dom'
```

### Step 4: Update `package.json`
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 5: Create First Test
**File: `lib/utils/__tests__/redirect.test.ts`**
```typescript
import { resolveSafeRedirect } from '../redirect'

describe('resolveSafeRedirect', () => {
  it('should return fallback for null input', () => {
    expect(resolveSafeRedirect(null)).toBe('/dashboard')
  })

  it('should return fallback for invalid path', () => {
    expect(resolveSafeRedirect('//evil.com')).toBe('/dashboard')
    expect(resolveSafeRedirect('http://evil.com')).toBe('/dashboard')
  })

  it('should return valid path', () => {
    expect(resolveSafeRedirect('/map')).toBe('/map')
    expect(resolveSafeRedirect('/dashboard')).toBe('/dashboard')
  })

  it('should decode URL encoded paths', () => {
    expect(resolveSafeRedirect('/map%3Fdi%3D123')).toBe('/map?di=123')
  })
})
```

---

## 6. Create Utility Functions

### File: `lib/utils/redirect.ts`
```typescript
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
```

### File: `lib/constants/roles.ts`
```typescript
/**
 * User roles in the system
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role)
}
```

### File: `lib/types/user.ts`
```typescript
/**
 * User metadata structure
 */
export interface UserMetadata {
  full_name?: string
  name?: string
  username?: string
  avatar_url?: string
  picture?: string
  role?: string
}

/**
 * App metadata structure
 */
export interface AppMetadata {
  role?: string
}

/**
 * Extended user type with typed metadata
 */
export interface TypedUser {
  id: string
  email?: string
  user_metadata: UserMetadata
  app_metadata: AppMetadata
}
```

---

## 7. Update .gitignore

Sudah dilakukan di file `.gitignore` - tambahkan entries untuk testing, IDE, dan OS files.

---

## Testing Checklist

Setelah melakukan fixes di atas, test:

- [ ] Login/logout masih bekerja
- [ ] Middleware redirect masih bekerja
- [ ] Admin routes masih protected
- [ ] CORS headers di Edge Function sudah benar
- [ ] Tidak ada hardcoded URLs di code
- [ ] Tests dapat dijalankan dengan `npm test`

---

## Next Steps

Setelah quick fixes ini selesai, lanjutkan ke:
1. Replace `any` types (lihat `REVIEW_AND_RECOMMENDATIONS.md`)
2. Implement pagination
3. Add Error Boundaries
4. Improve error handling
