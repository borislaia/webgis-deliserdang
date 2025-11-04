"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import IrrigationManagementView from '@/components/IrrigationManagementView';

export default function IrrigationManagementPage() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setIsAdmin(((data.user?.app_metadata as any)?.role) === 'admin');
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">WebGIS Deli Serdang - Manajemen Irigasi</span>
        </div>
        <nav>
          <button className="btn" onClick={() => (window.location.href = '/dashboard')}>Dashboard</button>
          <button className="btn" onClick={logout}>Logout</button>
        </nav>
      </header>

      <div className="layout">
        <main className="content">
          <IrrigationManagementView isAdmin={isAdmin} />
        </main>
      </div>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Deli Serdang</span>
      </footer>
    </main>
  );
}
