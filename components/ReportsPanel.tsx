"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ExcelJS from 'exceljs';
import Cookies from 'js-cookie';
import styles from './ReportsPanel.module.css';

interface DaerahIrigasiStats {
    id: string;
    k_di: string;
    n_di: string | null;
    luas_ha: number | null;
    kecamatan: string | null;
    sumber_air: string | null;
    kondisi: string | null;
    jumlah_saluran: number | null;
    jumlah_bangunan: number | null;
    panjang_sp: number | null;
    panjang_ss: number | null;
}

interface KecamatanSummary {
    name: string;
    count: number;
    totalLuas: number;
    percentage: number;
}

interface SumberAirSummary {
    name: string;
    count: number;
    percentage: number;
}

export default function ReportsPanel() {
    const [data, setData] = useState<DaerahIrigasiStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'kecamatan' | 'sumber'>('overview');

    // GeoJSON-based counts from storage
    const [geojsonCounts, setGeojsonCounts] = useState<{ totalSaluran: number; totalBangunan: number }>({ totalSaluran: 0, totalBangunan: 0 });
    const [loadingGeojson, setLoadingGeojson] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                const cookieTenant = Cookies.get('tenant_uptd');

                let query = supabase
                    .from('daerah_irigasi')
                    .select('id,k_di,n_di,luas_ha,kecamatan,sumber_air,kondisi,jumlah_saluran,jumlah_bangunan,panjang_sp,panjang_ss')
                    .order('k_di', { ascending: true });

                if (cookieTenant) {
                    query = query.eq('uptd', cookieTenant);
                }

                const { data: result, error: fetchError } = await query;
                if (fetchError) throw fetchError;
                setData(result || []);

                // Fetch GeoJSON counts from storage for each k_di
                if (result && result.length > 0) {
                    setLoadingGeojson(true);
                    let totalSaluran = 0;
                    let totalBangunan = 0;

                    // Process in parallel with Promise.all for better performance
                    const countPromises = result.map(async (di) => {
                        const counts = { saluran: 0, bangunan: 0 };
                        try {
                            // Fetch Saluran.json
                            const { data: saluranData } = await supabase.storage
                                .from('geojson')
                                .download(`${di.k_di}/Saluran.json`);
                            if (saluranData) {
                                const text = await saluranData.text();
                                const geojson = JSON.parse(text);
                                if (geojson.features) {
                                    counts.saluran = geojson.features.length;
                                }
                            }
                        } catch { }

                        try {
                            // Fetch Bangunan.json
                            const { data: bangunanData } = await supabase.storage
                                .from('geojson')
                                .download(`${di.k_di}/Bangunan.json`);
                            if (bangunanData) {
                                const text = await bangunanData.text();
                                const geojson = JSON.parse(text);
                                if (geojson.features) {
                                    counts.bangunan = geojson.features.length;
                                }
                            }
                        } catch { }

                        return counts;
                    });

                    const allCounts = await Promise.all(countPromises);
                    allCounts.forEach(c => {
                        totalSaluran += c.saluran;
                        totalBangunan += c.bangunan;
                    });

                    setGeojsonCounts({ totalSaluran, totalBangunan });
                    setLoadingGeojson(false);
                }
            } catch (e: any) {
                setError(e?.message || 'Gagal memuat data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate Summary Statistics
    const stats = useMemo(() => {
        if (!data.length) return null;

        const totalDI = data.length;
        const totalLuas = data.reduce((sum, d) => sum + (d.luas_ha || 0), 0);
        // Use GeoJSON counts if available, otherwise fallback to database columns
        const totalSaluran = geojsonCounts.totalSaluran > 0 ? geojsonCounts.totalSaluran : data.reduce((sum, d) => sum + (d.jumlah_saluran || 0), 0);
        const totalBangunan = geojsonCounts.totalBangunan > 0 ? geojsonCounts.totalBangunan : data.reduce((sum, d) => sum + (d.jumlah_bangunan || 0), 0);
        const totalPanjangSP = data.reduce((sum, d) => sum + (d.panjang_sp || 0), 0);
        const totalPanjangSS = data.reduce((sum, d) => sum + (d.panjang_ss || 0), 0);
        const avgLuas = totalLuas / totalDI;

        // Count by Kecamatan
        const kecamatanMap = new Map<string, { count: number; luas: number }>();
        data.forEach(d => {
            const key = d.kecamatan || 'Tidak Diketahui';
            const existing = kecamatanMap.get(key) || { count: 0, luas: 0 };
            kecamatanMap.set(key, {
                count: existing.count + 1,
                luas: existing.luas + (d.luas_ha || 0)
            });
        });

        const kecamatanSummary: KecamatanSummary[] = Array.from(kecamatanMap.entries())
            .map(([name, { count, luas }]) => ({
                name,
                count,
                totalLuas: luas,
                percentage: (count / totalDI) * 100
            }))
            .sort((a, b) => b.count - a.count);

        // Count by Sumber Air
        const sumberMap = new Map<string, number>();
        data.forEach(d => {
            const key = d.sumber_air || 'Tidak Diketahui';
            sumberMap.set(key, (sumberMap.get(key) || 0) + 1);
        });

        const sumberAirSummary: SumberAirSummary[] = Array.from(sumberMap.entries())
            .map(([name, count]) => ({
                name,
                count,
                percentage: (count / totalDI) * 100
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalDI,
            totalLuas,
            totalSaluran,
            totalBangunan,
            totalPanjangSP,
            totalPanjangSS,
            avgLuas,
            kecamatanSummary,
            sumberAirSummary
        };
    }, [data, geojsonCounts]);

    // Export to Excel
    const exportToExcel = async () => {
        if (!data.length) return;

        const workbook = new ExcelJS.Workbook();

        // Main data sheet
        const wsMain = workbook.addWorksheet('Daerah Irigasi');
        wsMain.columns = [
            { header: 'Kode DI', key: 'k_di', width: 15 },
            { header: 'Nama DI', key: 'n_di', width: 30 },
            { header: 'Luas (Ha)', key: 'luas_ha', width: 12 },
            { header: 'Kecamatan', key: 'kecamatan', width: 20 },
            { header: 'Sumber Air', key: 'sumber_air', width: 15 },
            { header: 'Kondisi', key: 'kondisi', width: 15 },
            { header: 'Jumlah Saluran', key: 'jumlah_saluran', width: 15 },
            { header: 'Jumlah Bangunan', key: 'jumlah_bangunan', width: 15 },
            { header: 'Panjang SP (m)', key: 'panjang_sp', width: 15 },
            { header: 'Panjang SS (m)', key: 'panjang_ss', width: 15 },
        ];
        data.forEach(d => {
            wsMain.addRow({
                k_di: d.k_di,
                n_di: d.n_di || '-',
                luas_ha: d.luas_ha || 0,
                kecamatan: d.kecamatan || '-',
                sumber_air: d.sumber_air || '-',
                kondisi: d.kondisi || '-',
                jumlah_saluran: d.jumlah_saluran || 0,
                jumlah_bangunan: d.jumlah_bangunan || 0,
                panjang_sp: d.panjang_sp || 0,
                panjang_ss: d.panjang_ss || 0,
            });
        });
        wsMain.getRow(1).font = { bold: true };

        // Summary sheet
        if (stats) {
            const wsSummary = workbook.addWorksheet('Ringkasan');
            wsSummary.columns = [
                { header: 'Metric', key: 'metric', width: 25 },
                { header: 'Nilai', key: 'nilai', width: 20 },
            ];
            wsSummary.addRow({ metric: 'Total Daerah Irigasi', nilai: stats.totalDI });
            wsSummary.addRow({ metric: 'Total Luas (Ha)', nilai: stats.totalLuas.toFixed(2) });
            wsSummary.addRow({ metric: 'Rata-rata Luas (Ha)', nilai: stats.avgLuas.toFixed(2) });
            wsSummary.addRow({ metric: 'Total Saluran', nilai: stats.totalSaluran });
            wsSummary.addRow({ metric: 'Total Bangunan', nilai: stats.totalBangunan });
            wsSummary.addRow({ metric: 'Total Panjang SP (m)', nilai: stats.totalPanjangSP.toFixed(2) });
            wsSummary.addRow({ metric: 'Total Panjang SS (m)', nilai: stats.totalPanjangSS.toFixed(2) });
            wsSummary.getRow(1).font = { bold: true };

            // Kecamatan sheet
            const wsKecamatan = workbook.addWorksheet('Per Kecamatan');
            wsKecamatan.columns = [
                { header: 'Kecamatan', key: 'kecamatan', width: 25 },
                { header: 'Jumlah DI', key: 'count', width: 12 },
                { header: 'Total Luas (Ha)', key: 'luas', width: 15 },
                { header: 'Persentase (%)', key: 'percentage', width: 15 },
            ];
            stats.kecamatanSummary.forEach(k => {
                wsKecamatan.addRow({
                    kecamatan: k.name,
                    count: k.count,
                    luas: k.totalLuas.toFixed(2),
                    percentage: k.percentage.toFixed(1),
                });
            });
            wsKecamatan.getRow(1).font = { bold: true };
        }

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Laporan_Irigasi_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export to CSV
    const exportToCSV = () => {
        if (!data.length) return;

        const headers = ['Kode DI', 'Nama DI', 'Luas (Ha)', 'Kecamatan', 'Sumber Air', 'Kondisi', 'Jumlah Saluran', 'Jumlah Bangunan'];
        const csvContent = [
            headers.join(','),
            ...data.map(d => [
                d.k_di,
                `"${(d.n_di || '-').replace(/"/g, '""')}"`,
                d.luas_ha || 0,
                `"${(d.kecamatan || '-').replace(/"/g, '""')}"`,
                `"${(d.sumber_air || '-').replace(/"/g, '""')}"`,
                `"${(d.kondisi || '-').replace(/"/g, '""')}"`,
                d.jumlah_saluran || 0,
                d.jumlah_bangunan || 0
            ].join(','))
        ].join('\n');

        // Add BOM for UTF-8 encoding to support special characters
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Irigasi_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <span>Memuat data laporan...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>Tidak ada data untuk ditampilkan.</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header with Export Buttons */}
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Laporan Daerah Irigasi</h3>
                    <p className={styles.subtitle}>Ringkasan dan statistik data irigasi</p>
                </div>
                <div className={styles.exportButtons}>
                    <button onClick={exportToExcel} className={`btn primary ${styles.exportBtn}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export Excel
                    </button>
                    <button onClick={exportToCSV} className={`btn ${styles.exportBtn}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalDI}</div>
                        <div className={styles.statLabel}>Total Daerah Irigasi</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalLuas.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</div>
                        <div className={styles.statLabel}>Total Luas (Ha)</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <line x1="4" y1="21" x2="4" y2="14" />
                            <line x1="4" y1="10" x2="4" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12" y2="3" />
                            <line x1="20" y1="21" x2="20" y2="16" />
                            <line x1="20" y1="12" x2="20" y2="3" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalSaluran.toLocaleString('id-ID')}</div>
                        <div className={styles.statLabel}>Total Saluran</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.totalBangunan.toLocaleString('id-ID')}</div>
                        <div className={styles.statLabel}>Total Bangunan</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{stats.avgLuas.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</div>
                        <div className={styles.statLabel}>Rata-rata Luas (Ha)</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{((stats.totalPanjangSP + stats.totalPanjangSS) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</div>
                        <div className={styles.statLabel}>Total Panjang (km)</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'kecamatan' ? styles.active : ''}`}
                    onClick={() => setActiveTab('kecamatan')}
                >
                    Per Kecamatan
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'sumber' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sumber')}
                >
                    Per Sumber Air
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overviewContent}>
                        <div className={styles.chartCard}>
                            <h4 className={styles.chartTitle}>Distribusi per Kecamatan (Top 10)</h4>
                            <div className={styles.barChart}>
                                {stats.kecamatanSummary.slice(0, 10).map((k, i) => (
                                    <div key={k.name} className={styles.barRow}>
                                        <div className={styles.barLabel}>{k.name}</div>
                                        <div className={styles.barContainer}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    width: `${k.percentage}%`,
                                                    background: `hsl(${210 - i * 15}, 70%, 50%)`
                                                }}
                                            />
                                            <span className={styles.barValue}>{k.count} DI</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'kecamatan' && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kecamatan</th>
                                    <th>Jumlah DI</th>
                                    <th>Total Luas (Ha)</th>
                                    <th>Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.kecamatanSummary.map((k, i) => (
                                    <tr key={k.name}>
                                        <td>{i + 1}</td>
                                        <td>{k.name}</td>
                                        <td>{k.count}</td>
                                        <td>{k.totalLuas.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                                        <td>
                                            <div className={styles.percentageCell}>
                                                <div
                                                    className={styles.percentageBar}
                                                    style={{ width: `${Math.min(k.percentage, 100)}%` }}
                                                />
                                                <span>{k.percentage.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'sumber' && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Sumber Air</th>
                                    <th>Jumlah DI</th>
                                    <th>Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.sumberAirSummary.map((s, i) => (
                                    <tr key={s.name}>
                                        <td>{i + 1}</td>
                                        <td>{s.name}</td>
                                        <td>{s.count}</td>
                                        <td>
                                            <div className={styles.percentageCell}>
                                                <div
                                                    className={styles.percentageBar}
                                                    style={{ width: `${Math.min(s.percentage, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
                                                />
                                                <span>{s.percentage.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
