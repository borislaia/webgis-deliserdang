"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import IrrigationManagementView from '@/components/IrrigationManagementView';

type Panel = 'di' | 'management' | 'reports' | 'users' | 'settings';

export default function DashboardPage() {
  const [activePanel, setActivePanel] = useState<Panel>('di');
  const [year] = useState<number>(new Date().getFullYear());
  const [userEmail, setUserEmail] = useState<string>('');

  // CSV state for Daerah Irigasi panel
  const [csvRows, setCsvRows] = useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUserEmail(data.user?.email || '');
      } catch {}
    })();
  }, []);

  // Load CSV from Supabase Storage bucket 'csv' when DI panel is active
  useEffect(() => {
    if (activePanel !== 'di') return;
    (async () => {
      setCsvLoading(true);
      setCsvError(null);
      setCsvRows(null);
      setCsvHeaders([]);
      try {
        const supabase = createClient();
        const objectPath = 'daerah_irigasi.csv';
        let text: string | null = null;

        // Coba unduh langsung via API
        const { data: fileData, error: dlError } = await supabase.storage.from('csv').download(objectPath);
        if (!dlError && fileData) {
          text = await fileData.text();
        }

        // Fallback ke URL publik (bucket public tidak butuh izin list)
        if (!text) {
          const { data: pub } = supabase.storage.from('csv').getPublicUrl(objectPath);
          const url = pub?.publicUrl;
          if (!url) throw new Error('URL publik CSV tidak tersedia');
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Gagal mengunduh CSV (HTTP ${res.status})`);
          text = await res.text();
        }

        const wb = XLSX.read(text!, { type: 'string' });
        const sheet = wb.SheetNames[0];
        const aoa: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, blankrows: false }) as any[];
        if (!Array.isArray(aoa) || aoa.length === 0) {
          setCsvRows([]);
          setCsvHeaders([]);
        } else {
          const [headerRow, ...dataRows] = aoa;
          const headers = (headerRow || []).map((h: any) => (h != null ? String(h) : '')) as string[];
          const rows = dataRows.map((row: any[]) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { obj[h || `col_${i + 1}`] = row[i] ?? ''; });
            return obj;
          });
          setCsvHeaders(headers);
          setCsvRows(rows);
        }
      } catch (e: any) {
        setCsvError(e?.message || 'Gagal memuat CSV');
        setCsvRows([]);
        setCsvHeaders([]);
      } finally {
        setCsvLoading(false);
      }
    })();
  }, [activePanel]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Ambil kode DI dari baris CSV bila tersedia, untuk query di halaman peta
  const getDiCodeFromRow = (row: Record<string, any>): string => {
    if (!row) return '';

    const normalize = (s: string) => s.toLowerCase().replace(/[\s\-\/()]+/g, '_');
    const keys = Object.keys(row);

    // 1) Pencocokan langsung berdasarkan nama kolom umum
    const directCandidates = new Set<string>([
      'k_di',
      'kode_di',
      'kode',
      'kdi',
      // variasi umum lain
      'kode_irigasi',
      'kode_irgasi',
      'k_irigasi',
      'kode_di_irigasi',
      'kode_daerah_irigasi',
    ]);
    for (const key of keys) {
      const normalized = normalize(key);
      if (directCandidates.has(normalized)) {
        const value = row[key];
        if (value != null && value !== '') return String(value).trim();
      }
    }

    // 2) Heuristik: kolom mengandung token 'kode' dan ('di' atau 'irig')
    const heuristicKeys = keys.filter((k) => {
      const n = normalize(k);
      return n.includes('kode') && (n.includes('di') || n.includes('irig'));
    });
    for (const key of heuristicKeys) {
      const val = row[key];
      const str = (val == null ? '' : String(val)).trim();
      if (/^\d{8}$/.test(str)) return str; // prefer 8 digit
      if (/^\d{6,12}$/.test(str)) return str;
    }

    // 3) Fallback terakhir: cari nilai angka 8–12 digit di baris
    for (const key of keys) {
      const str = (row[key] == null ? '' : String(row[key])).trim();
      if (/^\d{8}$/.test(str)) return str;
      if (/^\d{6,12}$/.test(str)) return str;
    }

    return '';
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
              <button className="btn" onClick={() => setActivePanel('di')}>Daerah Irigasi</button>
              <button className="btn" onClick={() => (window.location.href = '/map')}>Open Map</button>
              <button className="btn" onClick={() => setActivePanel('management')}>Manajemen Irigasi</button>
              <button className="btn" onClick={() => setActivePanel('reports')}>Reports</button>
              <button className="btn" onClick={() => setActivePanel('users')} id="usersBtn">Users</button>
              <button className="btn" onClick={() => setActivePanel('settings')}>Settings</button>
            </div>
          </div>
        </aside>
        <main className="content">
          {activePanel === 'di' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Daerah Irigasi (CSV)</h3>
              {csvLoading && <div className="loading">Loading...</div>}
              {csvError && <div className="error-message">{csvError}</div>}
              {!csvLoading && !csvError && csvRows && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {csvHeaders.map((h) => (
                          <th key={h || 'col'}>{h || '—'}</th>
                        ))}
                        <th key="__map">Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, idx) => (
                        <tr key={idx}>
                          {csvHeaders.map((h, i) => (
                            <td key={h + i}>{row[h || `col_${i + 1}`]}</td>
                          ))}
                          <td key="__map_btn">
                            <button
                              className="btn"
                              onClick={() => {
                                const di = getDiCodeFromRow(row as Record<string, any>);
                                const target = di ? `/map?di=${encodeURIComponent(di)}` : '/map';
                                window.location.href = target;
                              }}
                            >
                              Map
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activePanel === 'management' && (
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              <IrrigationManagementView />
            </div>
          )}

          {activePanel === 'reports' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Reports</h3>
              <p>Fitur laporan akan ditambahkan.</p>
            </div>
          )}

          {activePanel === 'users' && (
            <div className="card" style={{ padding: 18 }} id="usersPanel">
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
                <button className="btn primary" onClick={() => {}}>Refresh Users</button>
              </div>
            </div>
          )}

          {activePanel === 'settings' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Settings</h3>
              <p>Pengaturan akan ditambahkan.</p>
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
