import './globals.css'
import '../css/base.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import { headers } from 'next/headers'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WebGIS Deli Serdang',
  description: 'WebGIS Deli Serdang - Next.js + Supabase',
}

const VantaFog = dynamic(() => import('@/components/VantaFog'), { ssr: false })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Apply Vanta on all pages except /map
  const h = headers()
  const pathname = h.get('x-invoke-path') || ''
  const showVanta = !(pathname.startsWith('/map') || pathname.startsWith('/login'))
  return (
    <html lang="en">
      <body className={inter.className}>
        {showVanta && <VantaFog />}
        {children}
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
