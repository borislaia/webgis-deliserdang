"use client";
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { DaerahIrigasiRow, fetchDaerahIrigasiList } from '@/lib/daerahIrigasi';
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

  // Data Daerah Irigasi panel (dulu via CSV, kini langsung dari tabel)
  const [diRows, setDiRows] = useState<DaerahIrigasiRow[] | null>(null);
  const [diLoading, setDiLoading] = useState<boolean>(false);
  const [diError, setDiError] = useState<string | null>(null);

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

  // Muat data DI langsung dari tabel daerah_irigasi ketika panel aktif
  useEffect(() => {
    if (activePanel !== 'di') return;
    let cancelled = false;

    const loadDiRows = async () => {
      setDiLoading(true);
      setDiError(null);
      setDiRows(null);
      try {
        const supabase = createClient();
        const rows = await fetchDaerahIrigasiList(supabase);
        if (!cancelled) setDiRows(rows);
      } catch (e: any) {
        if (!cancelled) {
          setDiRows([]);
          setDiError(e?.message || 'Gagal memuat data DI');
        }
      } finally {
        if (!cancelled) setDiLoading(false);
      }
    };

    loadDiRows();
    return () => {
      cancelled = true;
    };
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

  // Ambil kode DI dari baris untuk query di halaman peta
  const getDiCodeFromRow = (row: Record<string, any>): string => {
    if (!row) return '';

    const directCandidates = ['k_di', 'kode_irigasi', 'kode_di', 'kode_di_irigasi', 'kode_daerah_irigasi', 'kdi', 'kode'];
    for (const key of directCandidates) {
      const value = row[key];
      if (value != null) {
        const str = String(value).trim();
        if (str) return str;
      }
    }

    // Fallback: cari angka 6–12 digit
    for (const value of Object.values(row)) {
      const str = value == null ? '' : String(value).trim();
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
                <button className="btn primary" onClick={() => (window.location.href = '/sebaran-irigasi')}>Sebaran Irigasi</button>
                <button className="btn" onClick={() => setActivePanel('di')}>Daerah Irigasi</button>
                <button className="btn" onClick={() => setActivePanel('management')}>Manajemen Irigasi</button>
                <button className="btn" onClick={() => setActivePanel('reports')}>Laporan</button>
                {isAdmin && (
                  <button className="btn" onClick={() => setActivePanel('users')} id="usersBtn">Users</button>
                )}
                <button className="btn" onClick={() => setActivePanel('settings')}>Pengaturan</button>
              </div>
          </div>
        </aside>
        <main className="content">
          {activePanel === 'di' && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>Daerah Irigasi</h3>
              {diLoading && <div className="loading">Memuat data...</div>}
              {diError && <div className="error-message">{diError}</div>}
              {!diLoading && !diError && diRows && diRows.length === 0 && <div className="info">Data daerah irigasi belum tersedia.</div>}
              {!diLoading && !diError && diRows && diRows.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode DI</th>
                        <th>Nama</th>
                        <th>Luas (Ha)</th>
                        <th>Kecamatan</th>
                        <th>Desa/Kel</th>
                        <th>Sumber Air</th>
                        <th>Tahun Data</th>
                        <th>MAP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.k_di || '-'}</td>
                          <td>{row.n_di || '-'}</td>
                          <td>{row.luas_ha ?? '-'}</td>
                          <td>{row.kecamatan || '-'}</td>
                          <td>{row.desa_kel || '-'}</td>
                          <td>{row.sumber_air || '-'}</td>
                          <td>{row.tahun_data || '-'}</td>
                          <td>
                            <button
                              className="btn primary"
                              onClick={() => {
                                const di = getDiCodeFromRow(row as Record<string, any>);
                                const target = di ? `/map?di=${encodeURIComponent(di)}` : '/sebaran-irigasi';
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
                            {users.map((user) => {
                              const isSelf = user.id === userId;
                              const isOtherAdmin = user.role === 'admin' && !isSelf;
                              const rowHighlight = isSelf
                                ? { background: 'rgba(10,132,255,0.05)' }
                                : isOtherAdmin
                                ? { background: 'rgba(94,92,230,0.06)' }
                                : undefined;
                              const lockMessage = isSelf
                                ? 'Role Anda dikunci'
                                : isOtherAdmin
                                ? 'Role admin lain dikunci'
                                : '';

                              return (
                                <tr key={user.id} style={rowHighlight}>
                                  <td>{user.email || '—'}</td>
                                  <td>
                                    <select
                                      className="role-select"
                                      value={user.role || 'user'}
                                      onChange={(e) => {
                                        if (isSelf || isOtherAdmin) return;
                                        updateUserRole(user.id, e.target.value);
                                      }}
                                      disabled={isSelf || isOtherAdmin || updatingUserId === user.id}
                                      title={lockMessage || undefined}
                                    >
                                      <option value="user">user</option>
                                      <option value="admin">admin</option>
                                    </select>
                                    {lockMessage && (
                                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>{lockMessage}</div>
                                    )}
                                  </td>
                                  <td>{user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '—'}</td>
                                  <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '—'}</td>
                                </tr>
                              );
                            })}
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
