"use client";
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import IrrigationManagementView from '@/components/IrrigationManagementView';

type Panel = 'di' | 'management' | 'reports' | 'users' | 'settings';
type UserRow = { id: string; email: string; role: string; created_at: string | null; last_sign_in_at: string | null };

export default function DashboardPage() {
  const [activePanel, setActivePanel] = useState<Panel>('di');
  const [year] = useState<number>(new Date().getFullYear());
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  const isAdmin = userRole === 'admin';

  // CSV state for Daerah Irigasi panel
  const [csvRows, setCsvRows] = useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvLoading, setCsvLoading] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Users panel state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        setUserId(user?.id || '');
        setUserEmail(user?.email || '');
        const displayName =
          (user?.user_metadata as any)?.full_name ||
          (user?.user_metadata as any)?.name ||
          (user?.user_metadata as any)?.username ||
          user?.email ||
          '';
        setUserName(displayName);
        const avatar =
          (user?.user_metadata as any)?.avatar_url ||
          (user?.user_metadata as any)?.picture ||
          '';
        setAvatarUrl(avatar);
        const role = (user?.app_metadata as any)?.role || (user?.user_metadata as any)?.role || 'user';
        setUserRole(role);
      } catch {}
    })();
  }, []);

  const userInitials = useMemo(() => {
    const source = (userName || userEmail || '').trim();
    if (!source) return 'U';
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    if (!parts.length) return source.slice(0, 2).toUpperCase();
    const [first, second] = parts;
    const initials = `${first[0] || ''}${second?.[0] || ''}`.toUpperCase();
    return initials || source.slice(0, 2).toUpperCase();
  }, [userName, userEmail]);

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

  const loadUsers = async (signal?: AbortSignal) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/admin/users', { signal, cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Gagal memuat data pengguna (${res.status})`);
      }
      const json = await res.json();
      setUsers(Array.isArray(json.users) ? json.users : []);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setUsersError(e?.message || 'Gagal memuat data pengguna');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activePanel !== 'users' || !isAdmin) return;
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [activePanel, isAdmin]);

  const updateUserRole = async (id: string, role: string) => {
    setUpdatingUserId(id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Gagal memperbarui role');
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      if (userId === id) {
        setUserRole(role);
      }
    } catch (e: any) {
      alert(e?.message || 'Gagal memperbarui role');
    } finally {
      setUpdatingUserId(null);
    }
  };

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
        <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="user-chip"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(6px)',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || userEmail || 'User'}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#1f2937',
                  color: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
                aria-hidden
              >
                {userInitials}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600 }}>{userName || 'Pengguna'}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{userEmail || '—'}</span>
              <span style={{ fontSize: 11, opacity: 0.65 }}>Role: {userRole || 'user'}</span>
            </div>
          </div>
          <button className="btn primary" onClick={() => (window.location.href = '/')}>Home</button>
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
              <button className="btn primary" onClick={() => (window.location.href = '/map')}>Sebaran Irigasi</button>
              <button className="btn" onClick={() => setActivePanel('di')}>Daerah Irigasi</button>
              <button className="btn" onClick={() => setActivePanel('management')}>Manajemen Irigasi</button>
              <button className="btn" onClick={() => setActivePanel('reports')}>Laporan</button>
              <button className="btn" onClick={() => setActivePanel('users')} id="usersBtn" disabled={!isAdmin}>Users</button>
              <button className="btn" onClick={() => setActivePanel('settings')}>Pengaturan</button>
            </div>
          </div>
        </aside>
        <main className="content">
          {activePanel === 'di' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Daerah Irigasi</h3>
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
                        <th key="__map">MAP</th>
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
                              className="primary-btn"
                              onClick={() => {
                                const di = getDiCodeFromRow(row as Record<string, any>);
                                const target = di ? `/map?di=${encodeURIComponent(di)}` : '/map';
                                window.location.href = target;
                              }}
                            >
                              MAP
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
              <IrrigationManagementView isAdmin={isAdmin} />
            </div>
          )}

          {activePanel === 'reports' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Laporan</h3>
              <p>Fitur laporan akan ditambahkan.</p>
            </div>
          )}

          {activePanel === 'users' && (
            <div className="card" style={{ padding: 18 }} id="usersPanel">
              <h3>User Management</h3>
              {!isAdmin && <p style={{ color: '#b91c1c' }}>Anda tidak memiliki akses untuk mengatur role. Hubungi admin.</p>}
              {isAdmin && (
                <>
                  {usersLoading && <div className="loading">Memuat data pengguna…</div>}
                  {usersError && <div className="error-message">{usersError}</div>}
                  {!usersLoading && !usersError && (
                    <div style={{ overflowX: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <button className="btn" onClick={() => loadUsers()}>Refresh</button>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Dibuat</th>
                            <th>Login Terakhir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.email || '—'}</td>
                              <td>
                                <select
                                  value={user.role || 'user'}
                                  onChange={(e) => updateUserRole(user.id, e.target.value)}
                                  disabled={updatingUserId === user.id}
                                >
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td>{user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '—'}</td>
                              <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activePanel === 'settings' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Pengaturan</h3>
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
