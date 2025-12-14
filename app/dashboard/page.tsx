"use client";
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant-context';
import IrrigationManagementView from '@/components/IrrigationManagementView';
import ReportsPanel from '@/components/ReportsPanel';
import Cookies from 'js-cookie';
import ExcelJS from 'exceljs';

type Panel = 'di' | 'management' | 'reports' | 'users' | 'settings';
type UserRow = { id: string; email: string; role: string; created_at: string | null; last_sign_in_at: string | null };
type DaerahIrigasiRow = {
  id: string;
  k_di: string;
  n_di: string | null;
  luas_ha: number | null;
  kecamatan: string | null;
  desa_kel: string | null;
  sumber_air: string | null;
  tahun_data: string | null;
};

export default function DashboardPage() {
  const [activePanel, setActivePanel] = useState<Panel>('di');
  const [year] = useState<number>(new Date().getFullYear());
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  // Tenant State from context
  const { tenant: tenantUptd } = useTenant();

  const isAdmin = userRole === 'admin';

  // Data Daerah Irigasi panel (dulu via CSV, kini langsung dari tabel)
  const [diRows, setDiRows] = useState<DaerahIrigasiRow[] | null>(null);
  const [diLoading, setDiLoading] = useState<boolean>(false);
  const [diError, setDiError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterSumberAir, setFilterSumberAir] = useState('');

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
      } catch { }
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

    const fetchDaerahIrigasi = async () => {
      setDiLoading(true);
      setDiError(null);
      setDiRows(null);
      try {
        const supabase = createClient();
        // Read cookie directly for data fetching (more reliable after SPA navigation)
        const cookieTenant = Cookies.get('tenant_uptd');

        let query = supabase
          .from('daerah_irigasi')
          .select('id,k_di,n_di,luas_ha,kecamatan,desa_kel,sumber_air,tahun_data')
          .order('k_di', { ascending: true });

        // Filter by Tenant if cookie exists
        console.log('[Dashboard] Raw Cookie tenant_uptd:', cookieTenant, 'Type:', typeof cookieTenant);

        if (cookieTenant) {
          console.log('[Dashboard] Applying filter .eq("uptd", "' + cookieTenant + '")');
          query = query.eq('uptd', cookieTenant);
        } else {
          console.log('[Dashboard] No UPTD filter applied (cookie missing or empty)');
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setDiRows(data || []);
      } catch (e: any) {
        if (!cancelled) {
          setDiRows([]);
          setDiError(e?.message || 'Gagal memuat data DI');
        }
      } finally {
        if (!cancelled) setDiLoading(false);
      }
    };

    fetchDaerahIrigasi();
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

  // Unique kecamatan and sumber_air options for filters
  const filterOptions = useMemo(() => {
    if (!diRows) return { kecamatan: [], sumberAir: [] };
    const kecamatanSet = new Set<string>();
    const sumberAirSet = new Set<string>();
    diRows.forEach(row => {
      if (row.kecamatan) kecamatanSet.add(row.kecamatan);
      if (row.sumber_air) sumberAirSet.add(row.sumber_air);
    });
    return {
      kecamatan: Array.from(kecamatanSet).sort(),
      sumberAir: Array.from(sumberAirSet).sort()
    };
  }, [diRows]);

  // Filtered rows based on search and filters
  const filteredDiRows = useMemo(() => {
    if (!diRows) return null;
    return diRows.filter(row => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          (row.k_di || '').toLowerCase().includes(query) ||
          (row.n_di || '').toLowerCase().includes(query) ||
          (row.kecamatan || '').toLowerCase().includes(query) ||
          (row.desa_kel || '').toLowerCase().includes(query);
        if (!matches) return false;
      }
      // Kecamatan filter
      if (filterKecamatan && row.kecamatan !== filterKecamatan) return false;
      // Sumber Air filter
      if (filterSumberAir && row.sumber_air !== filterSumberAir) return false;
      return true;
    });
  }, [diRows, searchQuery, filterKecamatan, filterSumberAir]);

  // Export to Excel
  const exportDiToExcel = async () => {
    const dataToExport = filteredDiRows || diRows;
    if (!dataToExport || !dataToExport.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daerah Irigasi');

    // Add headers
    worksheet.columns = [
      { header: 'Kode DI', key: 'k_di', width: 15 },
      { header: 'Nama', key: 'n_di', width: 30 },
      { header: 'Luas (Ha)', key: 'luas_ha', width: 12 },
      { header: 'Kecamatan', key: 'kecamatan', width: 20 },
      { header: 'Desa/Kel', key: 'desa_kel', width: 20 },
      { header: 'Sumber Air', key: 'sumber_air', width: 15 },
      { header: 'Tahun Data', key: 'tahun_data', width: 12 },
    ];

    // Add data
    dataToExport.forEach(d => {
      worksheet.addRow({
        k_di: d.k_di,
        n_di: d.n_di || '-',
        luas_ha: d.luas_ha || 0,
        kecamatan: d.kecamatan || '-',
        desa_kel: d.desa_kel || '-',
        sumber_air: d.sumber_air || '-',
        tahun_data: d.tahun_data || '-',
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daerah_Irigasi_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to CSV
  const exportDiToCSV = () => {
    const dataToExport = filteredDiRows || diRows;
    if (!dataToExport || !dataToExport.length) return;

    const headers = ['Kode DI', 'Nama', 'Luas (Ha)', 'Kecamatan', 'Desa/Kel', 'Sumber Air', 'Tahun Data'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(d => [
        d.k_di,
        `"${(d.n_di || '-').replace(/"/g, '""')}"`,
        d.luas_ha || 0,
        `"${(d.kecamatan || '-').replace(/"/g, '""')}"`,
        `"${(d.desa_kel || '-').replace(/"/g, '""')}"`,
        `"${(d.sumber_air || '-').replace(/"/g, '""')}"`,
        d.tahun_data || '-'
      ].join(','))
    ].join('\n');

    // Add BOM for UTF-8 encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daerah_Irigasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.png" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">
            WebGIS Deli Serdang {tenantUptd ? `UPTD ${tenantUptd}` : ''}
          </span>
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
              <Image
                src={avatarUrl}
                alt={userName || userEmail || 'User'}
                width={36}
                height={36}
                unoptimized
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' }}
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
          <Link href="/" className="btn">Home</Link>
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
              <Link href="/sebaran-irigasi" className="btn primary">Sebaran Irigasi</Link>
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
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header with title and export buttons */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--stroke)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                background: 'linear-gradient(180deg, #ffffff, #f9fafb)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Daerah Irigasi</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {filteredDiRows ? `${filteredDiRows.length} dari ${diRows?.length || 0} data` : 'Memuat...'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={exportDiToExcel} className="btn primary" style={{ fontSize: '0.875rem', padding: '8px 14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Excel
                  </button>
                  <button onClick={exportDiToCSV} className="btn" style={{ fontSize: '0.875rem', padding: '8px 14px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    CSV
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--stroke)',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                background: '#f9fafb'
              }}>
                {/* Search Input */}
                <div style={{ flex: '1 1 250px', position: 'relative' }}>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari kode, nama, kecamatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid var(--stroke)',
                      borderRadius: 10,
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  />
                </div>

                {/* Kecamatan Filter */}
                <select
                  value={filterKecamatan}
                  onChange={(e) => setFilterKecamatan(e.target.value)}
                  style={{
                    padding: '10px 32px 10px 12px',
                    border: '1px solid var(--stroke)',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    background: 'white',
                    minWidth: 160,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Semua Kecamatan</option>
                  {filterOptions.kecamatan.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                {/* Sumber Air Filter */}
                <select
                  value={filterSumberAir}
                  onChange={(e) => setFilterSumberAir(e.target.value)}
                  style={{
                    padding: '10px 32px 10px 12px',
                    border: '1px solid var(--stroke)',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    background: 'white',
                    minWidth: 160,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Semua Sumber Air</option>
                  {filterOptions.sumberAir.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(searchQuery || filterKecamatan || filterSumberAir) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterKecamatan('');
                      setFilterSumberAir('');
                    }}
                    className="btn"
                    style={{ padding: '10px 14px', fontSize: '0.875rem' }}
                  >
                    ✕ Reset
                  </button>
                )}
              </div>

              {/* Table Content */}
              <div style={{ padding: '0 24px 24px' }}>
                {diLoading && (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{
                      width: 32, height: 32,
                      border: '3px solid #e5e7eb',
                      borderTopColor: 'var(--brand)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px'
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Memuat data...
                  </div>
                )}
                {diError && <div className="error-message" style={{ marginTop: 16 }}>{diError}</div>}
                {!diLoading && !diError && filteredDiRows && filteredDiRows.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                    {diRows && diRows.length > 0 ? 'Tidak ada data yang cocok dengan filter.' : 'Data daerah irigasi belum tersedia.'}
                  </div>
                )}
                {!diLoading && !diError && filteredDiRows && filteredDiRows.length > 0 && (
                  <div style={{ overflowX: 'auto', marginTop: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid var(--stroke)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>KODE DI</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>NAMA</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>LUAS (HA)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>KECAMATAN</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>DESA/KEL</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>SUMBER AIR</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>TAHUN</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDiRows.map((row) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand)' }}>{row.k_di || '-'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 500 }}>{row.n_di || '-'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>{row.luas_ha?.toLocaleString('id-ID', { maximumFractionDigits: 2 }) ?? '-'}</td>
                            <td style={{ padding: '14px 16px' }}>{row.kecamatan || '-'}</td>
                            <td style={{ padding: '14px 16px' }}>{row.desa_kel || '-'}</td>
                            <td style={{ padding: '14px 16px' }}>{row.sumber_air || '-'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>{row.tahun_data || '-'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <Link
                                href={getDiCodeFromRow(row as Record<string, any>) ? `/map?di=${encodeURIComponent(getDiCodeFromRow(row as Record<string, any>))}` : '/sebaran-irigasi'}
                                className="btn primary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                🗺️ MAP
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePanel === 'management' && (
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              <IrrigationManagementView isAdmin={isAdmin} />
            </div>
          )}

          {activePanel === 'reports' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <ReportsPanel />
            </div>
          )}

          {activePanel === 'users' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--stroke)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} id="usersPanel">
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--stroke)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>User Management</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--muted)' }}>Manage user access roles and view activity.</p>
                </div>
                <button
                  className="btn"
                  onClick={() => loadUsers()}
                  style={{
                    background: 'white',
                    border: '1px solid var(--stroke)',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fontSize: '0.875rem',
                    padding: '8px 16px'
                  }}
                >
                  <span style={{ fontSize: '1.1em', marginRight: 4 }}>↺</span> Refresh
                </button>
              </div>

              {!isAdmin && (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 24px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    color: '#991b1b',
                    fontWeight: 500
                  }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Anda tidak memiliki akses untuk mengatur role. Silakan hubungi admin.
                  </div>
                </div>
              )}

              {isAdmin && (
                <>
                  {usersLoading && (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
                      <div className="loading-spinner" style={{
                        margin: '0 auto 16px',
                        width: 32,
                        height: 32,
                        border: '3px solid #e5e7eb',
                        borderTopColor: 'var(--brand)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      Memuat data pengguna...
                    </div>
                  )}
                  {usersError && (
                    <div style={{ padding: 24 }}>
                      <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        {usersError}
                      </div>
                    </div>
                  )}
                  {!usersLoading && !usersError && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--stroke)' }}>
                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>User</th>
                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Role Access</th>
                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Member Since</th>
                            <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Last Active</th>
                          </tr>
                        </thead>
                        <tbody style={{ background: 'white' }}>
                          {users.map((user) => {
                            const isSelf = user.id === userId;
                            const isOtherAdmin = user.role === 'admin' && !isSelf;

                            // Generate initials/color
                            const uEmail = user.email || '';
                            const uName = (user as any).user_metadata?.full_name || uEmail.split('@')[0];
                            const initials = uName.slice(0, 2).toUpperCase();
                            const avatarColor = uEmail.length % 2 === 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)';

                            return (
                              <tr key={user.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '16px 24px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: '50%',
                                      background: avatarColor,
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      fontSize: 14,
                                      flexShrink: 0,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}>
                                      {initials}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                          {user.email}
                                        </span>
                                        {isSelf && (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 8px',
                                            background: '#eff6ff',
                                            color: '#2563eb',
                                            borderRadius: 999,
                                            fontWeight: 600,
                                            border: '1px solid #dbeafe'
                                          }}>YOU</span>
                                        )}
                                      </div>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                                        ID: <span style={{ fontFamily: 'monospace' }}>{user.id.slice(0, 8)}...</span>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                  <div style={{ position: 'relative', width: 140 }}>
                                    <select
                                      className="modern-select"
                                      value={user.role || 'user'}
                                      onChange={(e) => {
                                        if (isSelf) return;  // Only block self-modification
                                        updateUserRole(user.id, e.target.value);
                                      }}
                                      disabled={isSelf || updatingUserId === user.id}
                                      style={{
                                        cursor: isSelf ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                    {/* Role Icon */}
                                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', color: 'var(--muted)' }}>
                                      {user.role === 'admin' ? (
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                      ) : (
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                      )}
                                    </div>
                                    {/* Chevron */}
                                    {!isSelf && !isOtherAdmin && (
                                      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)' }}>
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--text)', fontSize: '0.875rem' }}>
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    color: 'var(--muted)',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    background: '#f3f4f6',
                                    padding: '2px 8px',
                                    borderRadius: 4
                                  }}>
                                    {user.last_sign_in_at
                                      ? new Date(user.last_sign_in_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' })
                                      : 'Never'}
                                  </span>
                                </td>
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
