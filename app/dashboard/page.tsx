"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [showUsers, setShowUsers] = useState(false);
  const [year] = useState<number>(new Date().getFullYear());
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUserEmail(data.user?.email || '');
      } catch {}
    })();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">WebGIS Deli Serdang</span>
        </div>
        <nav>
          <button className="btn" onClick={logout}>Logout</button>
        </nav>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong>Menu</strong>
              <span className="badge">Dashboard</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn" onClick={() => (window.location.href = '/map')}>Open Map</button>
              <button className="btn" onClick={() => (window.location.href = '/irrigation-management')}>Manajemen Irigasi</button>
              <button className="btn" onClick={() => alert('Reports coming soon')}>Reports</button>
              <button className="btn" onClick={() => setShowUsers((v) => !v)} id="usersBtn">Users</button>
              <button className="btn" onClick={() => alert('Settings coming soon')}>Settings</button>
            </div>
          </div>
        </aside>
        <main className="content">
          <h2 style={{ marginTop: 0 }}>Welcome back</h2>
          <div className="card" style={{ padding: 18 }}>
            <p>
              Use the side panel to navigate. Click <strong>Open Map</strong> to view the GIS.
            </p>
          </div>

          {showUsers && (
            <div className="card" style={{ padding: 18, marginTop: 20 }} id="usersPanel">
              <h3>User Management</h3>
              <div>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, margin: '8px 0' }}>
                  <strong>Admin Feature</strong>
                  <br />
                  User management requires additional backend endpoints to be implemented.
                  <br />
                  <br />
                  Current user: {userEmail || 'Unknown'}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="btn primary" onClick={() => {}}>
                  Refresh Users
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="app-footer">
        <span>© {year} Deli Serdang</span>
      </footer>
    </main>
  );
}
