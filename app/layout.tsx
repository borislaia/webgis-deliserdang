import './globals.css'
import '../css/base.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import { headers } from 'next/headers'

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
  const showVanta = !pathname.startsWith('/map')
  return (
    <html lang="en">
      <body className={inter.className}>
        {showVanta && <VantaFog />}
        {children}
      </body>
    </html>
  )
}
