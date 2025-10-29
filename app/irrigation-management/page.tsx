"use client";
import { useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import IrrigationManagementView from '@/components/IrrigationManagementView';

export default function IrrigationManagementPage() {
  const supabase = useMemo(() => createClient(), []);

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
          <IrrigationManagementView />
        </main>
      </div>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Deli Serdang</span>
      </footer>
    </main>
  );
}
