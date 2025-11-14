"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

function classNames(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type IrrigationManagementViewProps = {
  isAdmin: boolean;
};

export default function IrrigationManagementView({ isAdmin }: IrrigationManagementViewProps) {
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'import-excel' | 'saluran' | 'ruas' | 'bangunan'>('overview');

  // Reset tab ke overview jika bukan admin dan sedang di tab import
  useEffect(() => {
    if (!isAdmin && (activeTab === 'import' || activeTab === 'import-excel')) {
      setActiveTab('overview');
    }
  }, [isAdmin, activeTab]);

  const [kodeDI, setKodeDI] = useState('');
  const [bangunanFile, setBangunanFile] = useState<File | null>(null);
  const [saluranFile, setSaluranFile] = useState<File | null>(null);
  const [fungsionalFile, setFungsionalFile] = useState<File | null>(null);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const [diList, setDiList] = useState<any[] | null>(null);
  const [saluranList, setSaluranList] = useState<any[] | null>(null);
  const [ruasList, setRuasList] = useState<any[] | null>(null);
  const [bangunanList, setBangunanList] = useState<any[] | null>(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('daerah_irigasi')
            .select('id,k_di,n_di,luas_ha,kecamatan,desa_kel,sumber_air,tahun_data')
            .limit(50);
          if (error) throw error;
          setDiList(data || []);
        } catch (e: any) {
          setDiList([]);
        }
      })();
    }
    if (activeTab === 'saluran') {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('saluran')
            .select('id,no_saluran,nama,jenis,panjang_total,luas_layanan,urutan')
            .order('urutan', { ascending: true })
            .limit(100);
          if (error) throw error;
          setSaluranList(data || []);
        } catch {
          setSaluranList([]);
        }
      })();
    }
    if (activeTab === 'ruas') {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('ruas')
            .select('id,no_ruas,urutan,panjang')
            .order('urutan', { ascending: true })
            .limit(100);
          if (error) throw error;
          setRuasList(data || []);
        } catch {
          setRuasList([]);
        }
      })();
    }
    if (activeTab === 'bangunan') {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('bangunan')
            .select('id,nama,tipe,latitude,longitude,urutan_di_saluran')
            .order('urutan_di_saluran', { ascending: true })
            .limit(100);
          if (error) throw error;
          setBangunanList(data || []);
        } catch {
          setBangunanList([]);
        }
      })();
    }
  }, [activeTab, supabase]);

  const readJsonFile = async (file: File | null) => {
    if (!file) return null as any;
    const text = await file.text();
    return JSON.parse(text);
  };

  const importGeoJson = async () => {
    if (importing) return;
    setMessage(null);
    setImporting(true);
    try {
      if (!isAdmin) {
        setMessage({ type: 'error', text: 'Hanya admin yang dapat melakukan import.' });
        return;
      }
      const trimmedKode = kodeDI.trim();
      if (!trimmedKode) {
        setMessage({ type: 'error', text: 'Kode DI wajib diisi' });
        return;
      }

      const folderName = trimmedKode.replace(/[^0-9a-zA-Z_-]/g, '_');
      if (!folderName) {
        setMessage({ type: 'error', text: 'Kode DI tidak valid untuk nama folder' });
        return;
      }

      const uploadIfProvided = async (label: string, file: File | null) => {
        if (!file) return;
        const fileName = (file.name || '').trim() || `${label.toLowerCase()}.json`;
        const path = `${folderName}/${fileName}`;
        const { error } = await supabase.storage
          .from('geojson')
          .upload(path, file, {
            upsert: true,
            cacheControl: '3600',
            contentType: file.type || 'application/json',
          });
        if (error) throw new Error(`Gagal mengunggah ${label}: ${error.message}`);
      };

      await Promise.all([
        uploadIfProvided('Bangunan', bangunanFile),
        uploadIfProvided('Saluran', saluranFile),
        uploadIfProvided('Fungsional', fungsionalFile),
      ]);

      const [bangunanData, saluranData, fungsionalData] = await Promise.all([
        readJsonFile(bangunanFile),
        readJsonFile(saluranFile),
        readJsonFile(fungsionalFile),
      ]);

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('import-irrigation-data', {
        body: { action: 'import', k_di: trimmedKode, bangunanData, saluranData, fungsionalData },
      });
      if (invokeError) throw new Error(invokeError.message || 'Gagal import');
      setMessage({ type: 'success', text: 'Import berhasil' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Terjadi kesalahan' });
    } finally {
      setImporting(false);
    }
  };

  const onExcelSelected = async (file: File | null) => {
    if (!file) return;
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
      setMessage({ type: 'success', text: `Excel dimuat (${sheet}, ${json.length} baris). Import Excel belum diimplementasikan.` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Gagal membaca Excel' });
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Manajemen Data Irigasi</h2>

      {!isAdmin && (
        <div className="info" style={{ marginBottom: 16 }}>
          Anda masuk sebagai pengguna biasa. Data dapat dilihat, tetapi perubahan hanya bisa dilakukan oleh admin.
        </div>
      )}

      {message && (
        <div className={classNames(message.type === 'error' ? 'error' : 'success')}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        <button className={classNames('tab', activeTab === 'overview' && 'active')} onClick={() => setActiveTab('overview')}>Overview</button>
        {isAdmin && (
          <>
            <button className={classNames('tab', activeTab === 'import' && 'active')} onClick={() => setActiveTab('import')}>Import GeoJSON</button>
            <button className={classNames('tab', activeTab === 'import-excel' && 'active')} onClick={() => setActiveTab('import-excel')}>Import Excel</button>
          </>
        )}
        <button className={classNames('tab', activeTab === 'saluran' && 'active')} onClick={() => setActiveTab('saluran')}>Saluran</button>
        <button className={classNames('tab', activeTab === 'ruas' && 'active')} onClick={() => setActiveTab('ruas')}>Ruas</button>
        <button className={classNames('tab', activeTab === 'bangunan' && 'active')} onClick={() => setActiveTab('bangunan')}>Bangunan</button>
      </div>

      {activeTab === 'overview' && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Daerah Irigasi</h3>
          {!diList && <div className="loading">Loading...</div>}
          {diList && (
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
                </tr>
              </thead>
              <tbody>
                {diList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.k_di}</td>
                    <td>{row.n_di}</td>
                    <td>{row.luas_ha}</td>
                    <td>{row.kecamatan}</td>
                    <td>{row.desa_kel}</td>
                    <td>{row.sumber_air}</td>
                    <td>{row.tahun_data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === 'import' && isAdmin && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Import Data dari GeoJSON</h3>
          <div className="import-section">
            <div className="form-group">
              <label htmlFor="kodeDI">Kode Daerah Irigasi</label>
              <input id="kodeDI" type="text" value={kodeDI} onChange={(e) => setKodeDI(e.target.value)} placeholder="e.g., 12120008" />
            </div>
            <div className="form-group">
              <label>File Bangunan (JSON)</label>
              <input type="file" accept=".json" onChange={(e) => setBangunanFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label>File Saluran (JSON)</label>
              <input type="file" accept=".json" onChange={(e) => setSaluranFile(e.target.files?.[0] || null)} />
            </div>
            <div className="form-group">
              <label>File Fungsional (JSON)</label>
              <input type="file" accept=".json" onChange={(e) => setFungsionalFile(e.target.files?.[0] || null)} />
            </div>
            <div className="btn-group">
              <button className="btn primary" onClick={importGeoJson} disabled={importing}>
                {importing ? 'Memproses...' : 'Import Data'}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setKodeDI('');
                  setBangunanFile(null);
                  setSaluranFile(null);
                  setFungsionalFile(null);
                  setMessage(null);
                }}
                disabled={importing}
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'import-excel' && isAdmin && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Import Data dari Excel</h3>
          <div className="import-section">
            <p style={{ marginBottom: 16 }}>Upload file Excel yang berisi data daerah irigasi, saluran, atau bangunan.</p>
            <div className="form-group">
              <label>File Excel (.xlsx)</label>
              <input type="file" accept=".xlsx,.xls" onChange={(e) => onExcelSelected(e.target.files?.[0] || null)} />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'saluran' && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Daftar Saluran</h3>
          {!saluranList && <div className="loading">Loading...</div>}
          {saluranList && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Jenis</th>
                  <th>Panjang (m)</th>
                  <th>Luas Layanan</th>
                </tr>
              </thead>
              <tbody>
                {saluranList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.no_saluran}</td>
                    <td>{row.nama}</td>
                    <td>{row.jenis}</td>
                    <td>{row.panjang_total}</td>
                    <td>{row.luas_layanan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === 'ruas' && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Daftar Ruas</h3>
          {!ruasList && <div className="loading">Loading...</div>}
          {ruasList && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>No Ruas</th>
                  <th>Urutan</th>
                  <th>Panjang (m)</th>
                </tr>
              </thead>
              <tbody>
                {ruasList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.no_ruas}</td>
                    <td>{row.urutan}</td>
                    <td>{row.panjang}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === 'bangunan' && (
        <section className="tab-content active card" style={{ padding: 24 }}>
          <h3>Daftar Bangunan</h3>
          {!bangunanList && <div className="loading">Loading...</div>}
          {bangunanList && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Tipe</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Urutan</th>
                </tr>
              </thead>
              <tbody>
                {bangunanList.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nama}</td>
                    <td>{row.tipe}</td>
                    <td>{row.latitude}</td>
                    <td>{row.longitude}</td>
                    <td>{row.urutan_di_saluran}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
