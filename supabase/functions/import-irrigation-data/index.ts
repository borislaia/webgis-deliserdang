import { createClient } from 'npm:@supabase/supabase-js@2';
// Lightweight geodesic utilities (avoid heavy turf bundle)
// Distances in meters, coords as [lon, lat]
function haversine(a: number[], b: number[]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function lineLengthMeters(coords: number[][]): number {
  let d = 0;
  for (let i = 1; i < coords.length; i++) d += haversine(coords[i - 1], coords[i]);
  return d;
}

function pointAtDistance(coords: number[][], distance: number): number[] {
  if (distance <= 0) return coords[0];
  let remaining = distance;
  for (let i = 1; i < coords.length; i++) {
    const segLen = haversine(coords[i - 1], coords[i]);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      const p0 = coords[i - 1];
      const p1 = coords[i];
      return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
    }
    remaining -= segLen;
  }
  return coords[coords.length - 1];
}

function subLineBetween(coords: number[][], startDist: number, endDist: number): number[][] {
  const result: number[][] = [];
  const total = lineLengthMeters(coords);
  const s = Math.max(0, Math.min(startDist, total));
  const e = Math.max(0, Math.min(endDist, total));
  if (e <= s) return [];
  const startPoint = pointAtDistance(coords, s);
  const endPoint = pointAtDistance(coords, e);
  result.push(startPoint);
  let acc = 0;
  for (let i = 1; i < coords.length; i++) {
    const segLen = haversine(coords[i - 1], coords[i]);
    const nextAcc = acc + segLen;
    if (nextAcc > s && acc < e) {
      // include this vertex if it's strictly inside (s, e)
      const vDist = acc + segLen; // end of this segment
      const vAt = Math.max(acc, s);
      if (acc >= s && nextAcc <= e) result.push(coords[i]);
    }
    acc = nextAcc;
  }
  result.push(endPoint);
  return result;
}

function includesAny(text: string | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

function findUpstreamAnchorsForSaluran(bangunanFeatures: BangunanFeature[] | undefined, saluranNama: string | undefined): number[][] {
  if (!bangunanFeatures || !saluranNama) return [];
  const anchors: number[][] = [];
  const keys = ['bendung', 'pengambilan', 'intake'];
  for (const f of bangunanFeatures) {
    const p = f.properties as any;
    const same = (p?.saluran || p?.nama || '').toString().trim() === saluranNama.toString().trim();
    const isAnchor = includesAny(p?.n_aset, keys) || includesAny(p?.nomenklatu, keys) || includesAny(p?.nama, keys);
    if (same && isAnchor) anchors.push(f.geometry.coordinates);
  }
  return anchors;
}

function ensureUpstreamFirst(lineCoords: number[][], anchorPoints: number[][]): number[][] {
  if (!anchorPoints.length || !lineCoords.length) return lineCoords;
  // choose the nearest anchor to either start or end; reverse if end is nearer
  let minStart = Infinity;
  let minEnd = Infinity;
  for (const a of anchorPoints) {
    minStart = Math.min(minStart, haversine(a, lineCoords[0]));
    minEnd = Math.min(minEnd, haversine(a, lineCoords[lineCoords.length - 1]));
  }
  if (minEnd < minStart) return [...lineCoords].reverse();
  return lineCoords;
}

// Get allowed origin from environment or use fallback
const getAllowedOrigin = (): string => {
  const origin = Deno.env.get('ALLOWED_ORIGIN');
  if (origin) return origin;
  
  // Fallback untuk development
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    return 'http://localhost:3000';
  }
  
  // Production: extract dari referer atau gunakan env
  return Deno.env.get('PRODUCTION_URL') || 'https://yourdomain.com';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Credentials': 'true',
};

interface BangunanFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    id_di: string;
    k_di: string;
    n_di: string;
    nama: string;
    nomenklatu: string;
    k_aset: string;
    n_aset: string;
    norec: string;
    norec_salu: string;
    saluran: string;
  };
}

interface SaluranFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    id_di: string;
    k_di: string;
    n_di: string;
    nama: string;
    nomenklatu: string;
    k_aset: string;
    n_aset: string;
    panjang_sa: string;
    luas_layan: string;
    norec: string;
    saluran: string;
  };
}

interface FungsionalFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
  properties: {
    NAMA_DI: string;
    LUAS_HA: number;
    Thn_Dat: string;
    Kondisi: string;
    Kecamatan: string;
    Desa_Kel: string;
    Smb_Air: string;
    PANJANG_SP: number;
    PANJANG_SS: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, k_di, bangunanData, saluranData, fungsionalData } = await req.json();

    // Admin check
    const authHeader = req.headers.get('Authorization') || '';
    const token = (authHeader.match(/^Bearer\s+(.+)$/i) || [])[1];
    let isAdmin = false;
    if (token) {
      try {
        const { data: userRes } = await supabase.auth.getUser(token);
        isAdmin = (userRes?.user?.app_metadata as any)?.role === 'admin';
      } catch { /* ignore */ }
    }

    if (action === 'import') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // 1. Create or update daerah_irigasi
      const diData = fungsionalData?.features?.[0]?.properties;
      
      const { data: existingDI, error: checkError } = await supabase
        .from('daerah_irigasi')
        .select('id')
        .eq('k_di', k_di)
        .maybeSingle();

      let diId: string;

      if (existingDI) {
        // Update existing
        const { data: updatedDI, error: updateError } = await supabase
          .from('daerah_irigasi')
          .update({
            n_di: diData?.NAMA_DI || '',
            luas_ha: diData?.LUAS_HA || 0,
            kecamatan: diData?.Kecamatan || '',
            desa_kel: diData?.Desa_Kel || '',
            sumber_air: diData?.Smb_Air || '',
            tahun_data: diData?.Thn_Dat || '',
            kondisi: diData?.Kondisi || '',
            panjang_sp: diData?.PANJANG_SP || 0,
            panjang_ss: diData?.PANJANG_SS || 0,
          })
          .eq('k_di', k_di)
          .select('id')
          .single();

        if (updateError) throw updateError;
        diId = updatedDI.id;
      } else {
        // Insert new
        const { data: newDI, error: insertError } = await supabase
          .from('daerah_irigasi')
          .insert({
            k_di,
            n_di: diData?.NAMA_DI || '',
            luas_ha: diData?.LUAS_HA || 0,
            kecamatan: diData?.Kecamatan || '',
            desa_kel: diData?.Desa_Kel || '',
            sumber_air: diData?.Smb_Air || '',
            tahun_data: diData?.Thn_Dat || '',
            kondisi: diData?.Kondisi || '',
            panjang_sp: diData?.PANJANG_SP || 0,
            panjang_ss: diData?.PANJANG_SS || 0,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        diId = newDI.id;
      }

      // 2. Import bangunan
      const bangunanMap = new Map<string, string>();
      if (bangunanData?.features) {
        for (const feature of bangunanData.features as BangunanFeature[]) {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;

          const { data: bangunan, error: bangunanError } = await supabase
            .from('bangunan')
            .insert({
              daerah_irigasi_id: diId,
              nama: props.nama || '',
              nomenklatur: props.nomenklatu || '',
              k_aset: props.k_aset || '',
              n_aset: props.n_aset || '',
              tipe: props.n_aset || '',
              latitude: coords[1],
              longitude: coords[0],
              elevation: coords[2] || 0,
              geojson: feature,
              metadata: { norec: props.norec, norec_salu: props.norec_salu, saluran: props.saluran },
            })
            .select('id')
            .single();

          if (bangunanError) throw bangunanError;
          bangunanMap.set(props.norec, bangunan.id);
        }
      }

      // 3. Import saluran per polyline (no merge) and create ruas @50m each
      let saluranCounter = 1;
      const imagesFolderMap: Record<string, string> = {};
      // Preload image subfolders for mapping SAL### -> folder by ordinal
      try {
        const { data: imageSubdirs } = await supabase.storage.from('images').list(`${k_di}/`, { limit: 200 });
        const dirs = (imageSubdirs || []).filter((e: any) => e.id || e.name).map((e: any) => e.name);
        const naturalSorted = dirs.slice().sort((a: string, b: string) => {
          const ax = parseInt(a);
          const bx = parseInt(b);
          if (!isNaN(ax) && !isNaN(bx)) return ax - bx;
          return a.localeCompare(b, 'id');
        });
        naturalSorted.forEach((name, idx) => {
          imagesFolderMap[`SAL${String(idx + 1).padStart(3, '0')}`] = name; // map SAL001 -> '1 - Saluran Primer' etc
        });
      } catch { /* ignore */ }

      if (saluranData?.features) {
        for (const feature of saluranData.features as SaluranFeature[]) {
          let lineCoords = feature.geometry.coordinates;
          if (!lineCoords || lineCoords.length < 2) continue;

          // Determine jenis from props
          const props = feature.properties || ({} as any);
          let jenis = 'primer' as 'primer' | 'sekunder' | 'tersier';
          if (props.k_aset === 'S02' || props.nomenklatu?.includes?.('RS')) jenis = 'sekunder';
          else if (props.k_aset === 'S03' || props.nomenklatu?.includes?.('RT')) jenis = 'tersier';

          // Orient line from upstream (anchor) to downstream
          const anchors = findUpstreamAnchorsForSaluran(bangunanData?.features as any, props.nama || props.saluran || '');
          if (anchors.length) lineCoords = ensureUpstreamFirst(lineCoords, anchors);

          const totalLen = lineLengthMeters(lineCoords);
          const no_saluran = `SAL${String(saluranCounter).padStart(3, '0')}`;

          // Create saluran (one record per polyline)
          const { data: saluran, error: saluranError } = await supabase
            .from('saluran')
            .insert({
              daerah_irigasi_id: diId,
              no_saluran,
              nama: props.nama || props.saluran || no_saluran,
              nomenklatur: props.nomenklatu || '',
              jenis,
              panjang_total: totalLen,
              luas_layanan: parseFloat(props.luas_layan || '0') || 0,
              urutan: saluranCounter,
              geojson: { type: 'FeatureCollection', features: [feature] },
            })
            .select('id')
            .single();
          if (saluranError) throw saluranError;

          // Segment the line into ~50m chunks, last chunk may be <50m but counts as one ruas
          const step = 50; // meters
          const numSegments = Math.max(1, Math.ceil(totalLen / step));
          let start = 0;
          for (let i = 0; i < numSegments; i++) {
            const end = i === numSegments - 1 ? totalLen : Math.min(totalLen, start + step);
            const seg = subLineBetween(lineCoords, start, end);
            const no_ruas = `Ruas - ${i + 1}`;

            // Try to find photo URLs under images/<k_di>/<mapped_folder or SAL###>/Ruas - N.*
            let foto_urls: string[] = [];
            try {
              const folderName = imagesFolderMap[no_saluran] || no_saluran;
              const listPath = `${k_di}/${folderName}/`;
              const { data: files } = await supabase.storage.from('images').list(listPath, { limit: 200 });
              const exts = ['.webp', '.jpg', '.jpeg', '.png'];
              const matches = (files || []).filter((f: any) => {
                if (!f.name) return false;
                const lower = f.name.toLowerCase();
                if (!lower.startsWith(no_ruas.toLowerCase())) return false;
                return exts.some((ext) => lower.endsWith(ext));
              });
              const base = `${supabaseUrl}/storage/v1/object/public/images/${encodeURIComponent(k_di)}/${encodeURIComponent(folderName)}`;
              foto_urls = matches.map((m: any) => `${base}/${encodeURIComponent(m.name)}`);
            } catch { /* ignore */ }

            await supabase
              .from('ruas')
              .insert({
                saluran_id: (saluran as any).id,
                no_ruas,
                urutan: i + 1,
                panjang: Math.max(0, end - start),
                bangunan_awal_id: null,
                bangunan_akhir_id: null,
                geojson: { type: 'Feature', geometry: { type: 'LineString', coordinates: seg }, properties: { no_saluran, no_ruas } },
                foto_urls,
              });

            start = end;
          }

          saluranCounter++;
        }
      }

      // 4. Import fungsional data
      if (fungsionalData?.features) {
        for (const feature of fungsionalData.features as FungsionalFeature[]) {
          const props = feature.properties;
          
          await supabase
            .from('fungsional')
            .insert({
              daerah_irigasi_id: diId,
              nama_di: props.NAMA_DI || '',
              luas_ha: props.LUAS_HA || 0,
              kecamatan: props.Kecamatan || '',
              desa_kel: props.Desa_Kel || '',
              sumber_air: props.Smb_Air || '',
              tahun_data: props.Thn_Dat || '',
              kondisi: props.Kondisi || '',
              panjang_sp: props.PANJANG_SP || 0,
              panjang_ss: props.PANJANG_SS || 0,
              geojson: feature,
            });
        }
      }

      // 5. Update statistics in daerah_irigasi
      const { data: saluranCount } = await supabase
        .from('saluran')
        .select('id', { count: 'exact', head: true })
        .eq('daerah_irigasi_id', diId);

      const { data: bangunanCount } = await supabase
        .from('bangunan')
        .select('id', { count: 'exact', head: true })
        .eq('daerah_irigasi_id', diId);

      await supabase
        .from('daerah_irigasi')
        .update({
          jumlah_saluran: Math.max(0, (saluranCounter - 1)),
          jumlah_bangunan: bangunanData?.features?.length || 0,
        })
        .eq('id', diId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data imported successfully',
          daerah_irigasi_id: diId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'process_di') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!k_di) {
        return new Response(JSON.stringify({ error: 'k_di is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 0. Load files from Storage: geojson/<k_di>/*_Bangunan.json, *_Saluran.json, *_Fungsional.json
      const listRes = await supabase.storage.from('geojson').list(`${k_di}/`, { limit: 200 });
      const files = (listRes.data || []).map((f: any) => f.name as string);
      const bangunanName = files.find((n) => /bangunan\.json$/i.test(n));
      const saluranName = files.find((n) => /saluran\.json$/i.test(n));
      const fungsionalName = files.find((n) => /fungsional\.json$/i.test(n));
      if (!bangunanName || !saluranName || !fungsionalName) {
        return new Response(JSON.stringify({ error: 'Required files not found in geojson bucket' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const readJson = async (path: string) => {
        const { data, error } = await supabase.storage.from('geojson').download(path);
        if (error || !data) throw error || new Error('download failed');
        const text = await data.text();
        return JSON.parse(text);
      };

      const base = `${k_di}/`;
      const [bangunanJson, saluranJson, fungsionalJson] = await Promise.all([
        readJson(base + bangunanName),
        readJson(base + saluranName),
        readJson(base + fungsionalName),
      ]);

      // Keep a raw backup copy
      try {
        await supabase.storage.from('geojson').copy(base + saluranName, `raw/${base}${saluranName}`);
      } catch { /* ignore */ }

      // 1. Clear existing DI data to avoid duplicates
      const { data: diExisting } = await supabase.from('daerah_irigasi').select('id').eq('k_di', k_di).maybeSingle();
      if (diExisting?.id) {
        await supabase.from('daerah_irigasi').delete().eq('id', diExisting.id);
      }

      // 2. Reuse import flow
      const importReq = new Request(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify({ action: 'import', k_di, bangunanData: bangunanJson, saluranData: saluranJson, fungsionalData: fungsionalJson }) });
      // call self recursively is tricky in Deno; instead, inline minimal fields into local variables and reuse below logic by duplicating? For brevity, perform a direct DB import similar to 'import' above
      // Extract DI props
      const diData = fungsionalJson?.features?.[0]?.properties;
      const { data: newDI } = await supabase
        .from('daerah_irigasi')
        .insert({
          k_di,
          n_di: diData?.NAMA_DI || '',
          luas_ha: diData?.LUAS_HA || 0,
          kecamatan: diData?.Kecamatan || '',
          desa_kel: diData?.Desa_Kel || '',
          sumber_air: diData?.Smb_Air || '',
          tahun_data: diData?.Thn_Dat || '',
          kondisi: diData?.Kondisi || '',
          panjang_sp: diData?.PANJANG_SP || 0,
          panjang_ss: diData?.PANJANG_SS || 0,
        })
        .select('id')
        .single();
      const diId = (newDI as any).id as string;

      // Insert bangunan
      const bangunanMap = new Map<string, string>();
      for (const feature of (bangunanJson?.features || []) as BangunanFeature[]) {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        const { data: b } = await supabase
          .from('bangunan')
          .insert({
            daerah_irigasi_id: diId,
            nama: props?.nama || '',
            nomenklatur: props?.nomenklatu || '',
            k_aset: props?.k_aset || '',
            n_aset: props?.n_aset || '',
            tipe: props?.n_aset || '',
            latitude: coords?.[1],
            longitude: coords?.[0],
            elevation: coords?.[2] || 0,
            geojson: feature,
            metadata: { norec: props?.norec, norec_salu: props?.norec_salu, saluran: props?.saluran },
          })
          .select('id')
          .single();
        if (props?.norec && b?.id) bangunanMap.set(props.norec, b.id);
      }

      // Map images folders in order as before
      const imagesFolderMap: Record<string, string> = {};
      try {
        const { data: imageSubdirs } = await supabase.storage.from('images').list(`${k_di}/`, { limit: 200 });
        const dirs = (imageSubdirs || []).filter((e: any) => e.id || e.name).map((e: any) => e.name);
        const naturalSorted = dirs.slice().sort((a: string, b: string) => {
          const ax = parseInt(a);
          const bx = parseInt(b);
          if (!isNaN(ax) && !isNaN(bx)) return ax - bx;
          return a.localeCompare(b, 'id');
        });
        naturalSorted.forEach((name, idx) => { imagesFolderMap[`SAL${String(idx + 1).padStart(3, '0')}`] = name; });
      } catch { /* ignore */ }

      // Insert saluran + ruas per polyline with segmentation and collect segmented features for output file
      const segmentedFeatures: any[] = [];
      let saluranCounter = 1;
      for (const feature of (saluranJson?.features || []) as SaluranFeature[]) {
        let coords = feature.geometry?.coordinates || [];
        if (!coords || coords.length < 2) continue;
        const props = feature.properties || ({} as any);
        let jenis = 'primer' as 'primer' | 'sekunder' | 'tersier';
        if (props.k_aset === 'S02' || props.nomenklatu?.includes?.('RS')) jenis = 'sekunder';
        else if (props.k_aset === 'S03' || props.nomenklatu?.includes?.('RT')) jenis = 'tersier';

        const anchors = findUpstreamAnchorsForSaluran((bangunanJson?.features || []) as any, props.nama || props.saluran || '');
        if (anchors.length) coords = ensureUpstreamFirst(coords, anchors);
        const totalLen = lineLengthMeters(coords);
        const no_saluran = `SAL${String(saluranCounter).padStart(3, '0')}`;

        const { data: sRow } = await supabase
          .from('saluran')
          .insert({
            daerah_irigasi_id: diId,
            no_saluran,
            nama: props.nama || props.saluran || no_saluran,
            nomenklatur: props.nomenklatu || '',
            jenis,
            panjang_total: totalLen,
            luas_layanan: parseFloat(props.luas_layan || '0') || 0,
            urutan: saluranCounter,
            geojson: { type: 'FeatureCollection', features: [feature] },
          })
          .select('id')
          .single();

        const step = 50;
        const segCount = Math.max(1, Math.ceil(totalLen / step));
        let start = 0;
        for (let i = 0; i < segCount; i++) {
          const end = i === segCount - 1 ? totalLen : Math.min(totalLen, start + step);
          const segCoords = subLineBetween(coords, start, end);
          const no_ruas = `Ruas - ${i + 1}`;
          let foto_urls: string[] = [];
          try {
            const folderName = imagesFolderMap[no_saluran] || no_saluran;
            const listPath = `${k_di}/${folderName}/`;
            const { data: files } = await supabase.storage.from('images').list(listPath, { limit: 200 });
            const exts = ['.webp', '.jpg', '.jpeg', '.png'];
            const matches = (files || []).filter((f: any) => {
              if (!f.name) return false;
              const lower = f.name.toLowerCase();
              if (!lower.startsWith(no_ruas.toLowerCase())) return false;
              return exts.some((ext) => lower.endsWith(ext));
            });
            const basePub = `${supabaseUrl}/storage/v1/object/public/images/${encodeURIComponent(k_di)}/${encodeURIComponent(folderName)}`;
            foto_urls = matches.map((m: any) => `${basePub}/${encodeURIComponent(m.name)}`);
          } catch { /* ignore */ }

          await supabase
            .from('ruas')
            .insert({
              saluran_id: (sRow as any).id,
              no_ruas,
              urutan: i + 1,
              panjang: Math.max(0, end - start),
              bangunan_awal_id: null,
              bangunan_akhir_id: null,
              geojson: { type: 'Feature', geometry: { type: 'LineString', coordinates: segCoords }, properties: { no_saluran, no_ruas } },
              foto_urls,
            });

          segmentedFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: segCoords }, properties: { no_saluran, no_ruas } });
          start = end;
        }

        saluranCounter++;
      }

      // Insert fungsional
      for (const feature of (fungsionalJson?.features || []) as FungsionalFeature[]) {
        const props = feature.properties;
        await supabase.from('fungsional').insert({
          daerah_irigasi_id: diId,
          nama_di: props.NAMA_DI || '',
          luas_ha: props.LUAS_HA || 0,
          kecamatan: props.Kecamatan || '',
          desa_kel: props.Desa_Kel || '',
          sumber_air: props.Smb_Air || '',
          tahun_data: props.Thn_Dat || '',
          kondisi: props.Kondisi || '',
          panjang_sp: props.PANJANG_SP || 0,
          panjang_ss: props.PANJANG_SS || 0,
          geojson: feature,
        });
      }

      await supabase
        .from('daerah_irigasi')
        .update({ jumlah_saluran: Math.max(0, saluranCounter - 1) })
        .eq('id', diId);

      // 3) Replace saluran file with segmented features
      try {
        const body = new Blob([JSON.stringify({ type: 'FeatureCollection', features: segmentedFeatures })], { type: 'application/json' });
        await supabase.storage.from('geojson').upload(`${k_di}/${saluranName}`, body, { upsert: true, cacheControl: '86400', contentType: 'application/json' });
      } catch { /* ignore */ }

      return new Response(JSON.stringify({ success: true, daerah_irigasi_id: diId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log error for debugging (only in development or with proper logging service)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    // In production, don't expose internal error details
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development'
    const responseMessage = isDevelopment ? errorMessage : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: responseMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});