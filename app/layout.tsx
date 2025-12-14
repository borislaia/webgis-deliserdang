import './globals.css'
import '../css/base.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import { headers } from 'next/headers'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

import { cookies } from 'next/headers'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const tenantUptd = cookieStore.get('tenant_uptd')?.value

  let title = 'WebGIS Deli Serdang'
  if (tenantUptd) {
    title += ` UPTD ${tenantUptd.trim()}`
  }

  return {
    title,
    description: 'WebGIS Deli Serdang - Next.js + Supabase',
    icons: {
      icon: '/assets/icons/logo-deliserdang.png',
    },
  }
}

const BackgroundManager = dynamic(() => import('@/components/backgrounds/BackgroundManager'), { ssr: false })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Apply Vanta on all pages except /map
  const h = headers()
  const pathname = h.get('x-invoke-path') || ''
  const showVanta = !(pathname.startsWith('/map') || pathname.startsWith('/login'))
  return (
    <html lang="en">
      <body className={inter.className}>
        {showVanta && <BackgroundManager defaultBackground="gradient" allowSwitch={true} />}
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
        {/* Sync Supabase client events to server cookies */}
        <Script id="supabase-auth-sync" strategy="afterInteractive">
          {`
            // Listen to Supabase auth state and sync to server
            (function(){
              if (!window.__supabaseAuthSynced) {
                window.__supabaseAuthSynced = true;
                import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
                  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
                  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                  if (!url || !key) return;
                  const sb = createClient(url, key);
                  sb.auth.onAuthStateChange(async (event, session) => {
                    try {
                      await fetch('/auth/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, session }) });
                    } catch {}
                  });
                }).catch(() => {});
              }
            })();
          `}
        </Script>
      </body>
    </html>
  )
}
