"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Row = Record<string, string>;

function parseCsv(csv: string): { headers: string[]; rows: Row[] } {
  // Minimal CSV parser: handles quotes and commas inside quotes
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        out.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };
  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows: Row[] = lines.slice(1).map(line => {
    const cells = parseLine(line);
    const row: Row = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim(); });
    return row;
  });
  return { headers, rows };
}

export default function HomePage() {
  const [data, setData] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/csv/daerah_irigasi.csv`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`CSV fetch failed: ${r.status}`);
        const text = await r.text();
        const { headers, rows } = parseCsv(text);
        setHeaders(headers);
        setData(rows);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // detect admin role
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = (data.user?.app_metadata as any)?.role;
      setIsAdmin(role === 'admin');
    }).catch(() => {});
  }, []);

  const kdiKey = useMemo(() => {
    const opts = ['k_di', 'K_DI', 'kode_di'];
    return headers.find((h) => opts.includes(h));
  }, [headers]);

  return (
    <main className="content" style={{ padding: 16 }}>
      <h2 style={{ margin: '12px 0 16px' }}>Daftar Daerah Irigasi</h2>
      {loading && <div>Memuat data…</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr>
                {headers.map((h) => (<th key={h} style={{ whiteSpace: 'nowrap' }}>{h}</th>))}
                <th style={{ whiteSpace: 'nowrap' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const kdi = kdiKey ? row[kdiKey] : '';
                const onProcess = async () => {
                  if (!kdi) return;
                  try {
                    setProcessing(kdi);
                    const supabase = createClient();
                    const { error } = await supabase.functions.invoke('import-irrigation-data', { body: { action: 'process_di', k_di: kdi } });
                    if (error) alert(`Gagal memproses ${kdi}: ${error.message}`);
                    else alert(`Berhasil memproses ${kdi}`);
                  } catch (e: any) {
                    alert(`Error: ${e?.message || e}`);
                  } finally {
                    setProcessing(null);
                  }
                };
                return (
                  <tr key={idx}>
                    {headers.map((h) => (<td key={h}>{row[h]}</td>))}
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a className="btn" href={`/map?k_di=${encodeURIComponent(kdi)}`}>Map</a>
                        <a className="btn" href={`/di/${encodeURIComponent(kdi)}`}>Profil</a>
                        {isAdmin && (
                          <button className="btn" onClick={onProcess} disabled={processing === kdi}>
                            {processing === kdi ? 'Processing…' : 'Process'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
