'use client'

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/hooks/useSWRConfig'

/**
 * SWR Provider untuk aplikasi.
 * Menyediakan caching dan revalidation untuk data fetching.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
