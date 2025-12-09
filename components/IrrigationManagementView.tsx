"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './IrrigationManagementView.module.css';
import StorageManager from './StorageManager';

type IrrigationManagementViewProps = {
  isAdmin: boolean;
};

// Define DI Type
interface DaerahIrigasi {
  id: string;
  k_di: string;
  n_di: string;
  luas_ha: number;
  kecamatan: string;
  desa_kel: string;
  sumber_air: string;
  tahun_data: string;
}

export default function IrrigationManagementView({ isAdmin }: IrrigationManagementViewProps) {
  const supabase = useMemo(() => createClient(), []);

  // State
  const [diList, setDiList] = useState<DaerahIrigasi[]>([]);
  const [selectedDI, setSelectedDI] = useState<DaerahIrigasi | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'data' | 'images' | 'pdf' | 'geojson'>('data');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<DaerahIrigasi>>({});

  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<DaerahIrigasi>>({
    k_di: '', n_di: '', kecamatan: '', desa_kel: '' // Defaults
  });

  // Fetch List
  const fetchDIList = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daerah_irigasi')
      .select('id,k_di,n_di,luas_ha,kecamatan,desa_kel,sumber_air,tahun_data')
      .order('n_di');
    setDiList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDIList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Selection
  const handleSelect = (di: DaerahIrigasi) => {
    setSelectedDI(di);
    setFormData(di);
    setActiveTab('data');
  };

  // Handle Form Change (Edit)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    });
  };

  // Handle Save (Edit)
  const handleSave = async () => {
    if (!selectedDI || !isAdmin) return;

    // Validation
    if (!formData.n_di || !formData.kecamatan || !formData.desa_kel) {
      alert("Nama, Kecamatan, dan Desa/Kelurahan tidak boleh kosong.");
      return;
    }

    console.log('Saving data:', formData);
    console.log('Selected DI ID:', selectedDI.id);

    try {
      const { data, error } = await supabase
        .from('daerah_irigasi')
        .update(formData)
        .eq('id', selectedDI.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update result:', data);
      alert('Data berhasil disimpan');
      await fetchDIList();
      setSelectedDI({ ...selectedDI, ...formData } as DaerahIrigasi);
    } catch (e: any) {
      console.error('Save error:', e);
      alert(`Gagal menyimpan: ${e.message}`);
    }
  };

  // Handle Create New (Submit)
  const submitCreate = async () => {
    if (!createForm.k_di || !createForm.n_di || !createForm.kecamatan || !createForm.desa_kel) {
      alert("Mohon lengkapi semua field yang bertanda * (KODE, NAMA, KECAMATAN, DESA/KEL)");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('daerah_irigasi')
        .insert({
          ...createForm,
          // Defaults for optional fields
          luas_ha: createForm.luas_ha || 0,
          sumber_air: createForm.sumber_air || '-',
          tahun_data: createForm.tahun_data || new Date().getFullYear().toString()
        })
        .select()
        .single();

      if (error) throw error;

      alert('Daerah Irigasi berhasil dibuat!');
      setIsCreating(false);
      setCreateForm({ k_di: '', n_di: '', kecamatan: '', desa_kel: '' }); // Reset
      await fetchDIList();
      handleSelect(data as DaerahIrigasi);
    } catch (e: any) {
      alert(`Gagal membuat DI: ${e.message}`);
    }
  };

  const handleDeleteDI = async () => {
    if (!selectedDI || !confirm(`Yakin hapus ${selectedDI.n_di}? Ini akan menghapus data di database, namun file di Storage mungkin tersisa.`)) return;

    const { error } = await supabase.from('daerah_irigasi').delete().eq('id', selectedDI.id);
    if (error) {
      alert(`Gagal: ${error.message}`);
    } else {
      setSelectedDI(null);
      fetchDIList();
    }
  };

  // Handle Sync (GeoJSON Process)
  const handleSyncGeoJSON = async () => {
    if (!selectedDI) return;
    if (!confirm("Proses ini akan membaca file GeoJSON di storage dan memperbarui data Saluran & Bangunan di database. Lanjutkan?")) return;

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/import-irrigation-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'process_di',
          k_di: selectedDI.k_di
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Unknown error');
      alert('Sinkronisasi Berhasil: ' + (result.message || 'Data terupdate.'));
    } catch (e: any) {
      alert(`Sinkronisasi Gagal: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Filter list
  const filteredList = diList.filter(d =>
    d.n_di?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.k_di?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.headerTitle}>Manajemen Data Irigasi</h2>
        {isAdmin && <button className="btn primary" onClick={() => setIsCreating(true)}>+ Tambah DI</button>}
      </header>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="modal open">
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24, background: '#fff' }}>
            <h3 style={{ marginTop: 0 }}>Tambah Daerah Irigasi Baru</h3>
            <p className={styles.label} style={{ marginBottom: 20 }}>Isi form berikut untuk membuat data baru. Semua field bertanda * wajib diisi.</p>

            <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.field}>
                <label className={styles.label}>Kode DI *</label>
                <input
                  className="input"
                  value={createForm.k_di}
                  onChange={(e) => setCreateForm({ ...createForm, k_di: e.target.value })}
                  placeholder="Contoh: 12120008"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nama Daerah Irigasi *</label>
                <input
                  className="input"
                  value={createForm.n_di}
                  onChange={(e) => setCreateForm({ ...createForm, n_di: e.target.value })}
                  placeholder="Nama DI"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Kecamatan *</label>
                <input
                  className="input"
                  value={createForm.kecamatan}
                  onChange={(e) => setCreateForm({ ...createForm, kecamatan: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Desa / Kelurahan *</label>
                <input
                  className="input"
                  value={createForm.desa_kel}
                  onChange={(e) => setCreateForm({ ...createForm, desa_kel: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Luas (Ha)</label>
                <input className="input" type="number" value={createForm.luas_ha || ''} onChange={(e) => setCreateForm({ ...createForm, luas_ha: parseFloat(e.target.value) })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sumber Air</label>
                <input className="input" value={createForm.sumber_air || ''} onChange={(e) => setCreateForm({ ...createForm, sumber_air: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tahun Data</label>
                <input className="input" value={createForm.tahun_data || ''} onChange={(e) => setCreateForm({ ...createForm, tahun_data: e.target.value })} />
              </div>
            </div>

            <div className={styles.actions}>
              <button className="btn" onClick={() => setIsCreating(false)}>Batal</button>
              <button className="btn primary" onClick={submitCreate}>Simpan & Buat</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* LEFT PANEL: LIST */}
        <aside className={styles.listPanel}>
          <div className={styles.searchBox}>
            <input
              className="input"
              placeholder="Cari Nama atau Kode DI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.listContainer}>
            {loading ? <div>Loading...</div> : filteredList.map(di => (
              <div
                key={di.id}
                className={`${styles.listItem} ${selectedDI?.id === di.id ? styles.active : ''}`}
                onClick={() => handleSelect(di)}
              >
                <div className={styles.itemTitle}>{di.n_di}</div>
                <div className={styles.itemSubtitle}>
                  <span>{di.k_di}</span>
                  <span>{di.kecamatan}</span>
                </div>
              </div>
            ))}
            {!loading && filteredList.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Tidak ditemukan</div>}
          </div>
        </aside>

        {/* RIGHT PANEL: DETAIL */}
        <main className={styles.detailPanel}>
          {!selectedDI ? (
            <div className={styles.emptyState}>
              <h3>Pilih Daerah Irigasi</h3>
              <p>Pilih item dari daftar di sebelah kiri untuk melihat detail dan mengelola aset.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 24, minHeight: 600 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>{selectedDI.n_di} <small style={{ color: 'var(--muted)', fontSize: '0.6em' }}>{selectedDI.k_di}</small></h2>
                {isAdmin && <button className="btn" style={{ color: 'red', borderColor: 'red' }} onClick={handleDeleteDI}>Hapus DI</button>}
              </div>

              <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'data' ? styles.active : ''}`} onClick={() => setActiveTab('data')}>Data Utama</button>
                <button className={`${styles.tab} ${activeTab === 'images' ? styles.active : ''}`} onClick={() => setActiveTab('images')}>Galeri Foto</button>
                <button className={`${styles.tab} ${activeTab === 'pdf' ? styles.active : ''}`} onClick={() => setActiveTab('pdf')}>Dokumen / Skema</button>
                <button className={`${styles.tab} ${activeTab === 'geojson' ? styles.active : ''}`} onClick={() => setActiveTab('geojson')}>Peta Digital (GeoJSON)</button>
              </div>

              {activeTab === 'data' && (
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Kode DI</label>
                    <input className="input" name="k_di" value={formData.k_di || ''} readOnly disabled title="Kode DI tidak dapat diubah" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Nama Daerah Irigasi</label>
                    <input className="input" name="n_di" value={formData.n_di || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Luas (Ha)</label>
                    <input className="input" type="number" name="luas_ha" value={formData.luas_ha || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Kecamatan</label>
                    <input className="input" name="kecamatan" value={formData.kecamatan || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Desa / Kelurahan</label>
                    <input className="input" name="desa_kel" value={formData.desa_kel || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Sumber Air</label>
                    <input className="input" name="sumber_air" value={formData.sumber_air || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Tahun Data</label>
                    <input className="input" name="tahun_data" value={formData.tahun_data || ''} onChange={handleChange} disabled={!isAdmin} />
                  </div>

                  {isAdmin && (
                    <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
                      <button className="btn primary" onClick={handleSave}>Simpan Perubahan</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'images' && (
                <StorageManager
                  bucketName="images"
                  folderPath={selectedDI.k_di}
                  acceptedTypes="image/*"
                />
              )}

              {activeTab === 'pdf' && (
                <div className={styles.storageSection}>
                  <div style={{ marginBottom: 16, fontSize: '0.9em', color: '#666' }}>
                    Upload file skema, buku pintar, atau dokumen pendukung lainnya (PDF).
                  </div>
                  <StorageManager
                    bucketName="pdf"
                    folderPath={selectedDI.k_di}
                    acceptedTypes=".pdf"
                  />
                </div>
              )}

              {activeTab === 'geojson' && (
                <div>
                  {isAdmin && (
                    <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #bae6fd' }}>
                      <h4 style={{ marginTop: 0, color: '#0369a1' }}>Sinkronisasi Data Spasial</h4>
                      <p style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>
                        Setelah mengupload file GeoJSON baru (Bangunan, Saluran, Fungsional), klik tombol sinkronisasi di bawah ini
                        untuk memperbarui tabel database.
                      </p>
                      <button className="btn primary" onClick={handleSyncGeoJSON} disabled={syncing}>
                        {syncing ? 'Sedang Memproses...' : '🔄 Sinkronisasi ke Database'}
                      </button>
                    </div>
                  )}

                  <h4 style={{ marginBottom: 10 }}>File GeoJSON</h4>
                  <StorageManager
                    bucketName="geojson"
                    folderPath={selectedDI.k_di}
                    acceptedTypes=".json,.geojson"
                  />
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
