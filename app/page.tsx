import Image from 'next/image'
import DashboardButton from '@/components/DashboardButton'

export const dynamic = 'force-static'
export default function HomePage() {
  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">WebGIS Deli Serdang</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <DashboardButton />
        </nav>
      </header>
      <section className="menu-grid" style={{ margin: '40px auto', padding: '0 16px' }}>
        <a className="menu-item" href="/login"><span className="label">Daerah Irigasi</span></a>
        <a className="menu-item" href="/login"><span className="label">Pemanfaatan SDA</span></a>
        <a className="menu-item" href="/login"><span className="label">Rawan Bencana</span></a>
        <a className="menu-item" href="/login"><span className="label">Infrastruktur SDA</span></a>
        <a className="menu-item" href="/login"><span className="label">Pos STA Curah Hujan <br/> dan AWLR</span></a>
        <a className="menu-item" href="/login"><span className="label">Danau, Situ, <br/> dan Embung</span></a>
        <a className="menu-item" href="/login"><span className="label">Saluran Pembuang/ <br/> Sungai</span></a>
        <a className="menu-item" href="/login"><span className="label">Garis Pantai</span></a>
      </section>
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Deli Serdang</span>
      </footer>
    </main>
  )
}
