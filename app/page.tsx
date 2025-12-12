import Image from 'next/image'
import DashboardButton from '@/components/DashboardButton'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createServerSupabase()

  // Fetch first DI code for the first menu item
  const { data: firstDI } = await supabase
    .from('daerah_irigasi')
    .select('k_di')
    .order('k_di', { ascending: true })
    .limit(1)
    .maybeSingle()

  const firstDILink = firstDI ? `/daerah-irigasi/${firstDI.k_di}` : '/login'

  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.png" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">WebGIS Deli Serdang</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <DashboardButton />
        </nav>
      </header>
      <section className="menu-grid" style={{ margin: '40px auto', padding: '0 16px' }}>
        <a className="menu-item" href={firstDILink}><span className="label">Daerah Irigasi</span></a>
        <a className="menu-item" href="/login"><span className="label">Pemanfaatan SDA</span></a>
        <a className="menu-item" href="/login"><span className="label">Rawan Bencana</span></a>
        <a className="menu-item" href="/login"><span className="label">Infrastruktur SDA</span></a>
        <a className="menu-item" href="/login"><span className="label">Pos STA Curah Hujan <br /> dan AWLR</span></a>
        <a className="menu-item" href="/login"><span className="label">Danau, Situ, <br /> dan Embung</span></a>
        <a className="menu-item" href="/login"><span className="label">Saluran Pembuang/ <br /> Sungai</span></a>
        <a className="menu-item" href="/login"><span className="label">Garis Pantai</span></a>
      </section>
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Deli Serdang</span>
      </footer>
    </main>
  )
}
