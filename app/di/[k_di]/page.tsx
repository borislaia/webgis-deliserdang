import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DIProfilePage({ params }: { params: { k_di: string } }) {
  const supabase = createServerSupabase();
  const kdi = params.k_di;

  const { data: di } = await supabase
    .from('daerah_irigasi')
    .select('*')
    .eq('k_di', kdi)
    .maybeSingle();

  let saluranCount = 0;
  let ruasCount = 0;
  let bangunanCount = 0;

  if (di) {
    const [{ count: sc }, { count: bc }, { count: rc }] = await Promise.all([
      supabase.from('saluran').select('id', { count: 'exact', head: true }).eq('k_di', kdi),
      supabase.from('bangunan').select('id', { count: 'exact', head: true }).eq('k_di', kdi),
      supabase.from('ruas').select('id', { count: 'exact', head: true }).eq('k_di', kdi),
    ]);
    saluranCount = sc || 0;
    bangunanCount = bc || 0;
    ruasCount = rc || 0;
  }

  return (
    <main className="content" style={{ padding: 16 }}>
      <h2>Profil Daerah Irigasi</h2>
      {!di ? (
        <div className="error-message">Data tidak ditemukan untuk k_di: {kdi}</div>
      ) : (
        <div className="card" style={{ padding: 16, maxWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><strong>Kode DI</strong><div>{di.k_di}</div></div>
            <div><strong>Nama DI</strong><div>{di.n_di}</div></div>
            <div><strong>Luas (Ha)</strong><div>{di.luas_ha}</div></div>
            <div><strong>Tahun Data</strong><div>{di.tahun_data}</div></div>
            <div><strong>Kecamatan</strong><div>{di.kecamatan}</div></div>
            <div><strong>Desa/Kel</strong><div>{di.desa_kel}</div></div>
            <div><strong>Sumber Air</strong><div>{di.sumber_air}</div></div>
            <div><strong>Kondisi</strong><div>{di.kondisi}</div></div>
          </div>
          <hr style={{ margin: '16px 0' }} />
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 12 }}><strong>Jumlah Saluran</strong><div>{saluranCount}</div></div>
            <div className="card" style={{ padding: 12 }}><strong>Jumlah Ruas</strong><div>{ruasCount}</div></div>
            <div className="card" style={{ padding: 12 }}><strong>Jumlah Bangunan</strong><div>{bangunanCount}</div></div>
          </div>
        </div>
      )}
    </main>
  );
}
