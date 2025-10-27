import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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

    if (action === 'import') {
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

      // 3. Import saluran and create automatic ruas
      const saluranGroups = new Map<string, SaluranFeature[]>();
      
      // Group saluran by name
      if (saluranData?.features) {
        for (const feature of saluranData.features as SaluranFeature[]) {
          const nama = feature.properties.nama || feature.properties.saluran || 'Unknown';
          if (!saluranGroups.has(nama)) {
            saluranGroups.set(nama, []);
          }
          saluranGroups.get(nama)!.push(feature);
        }
      }

      // Process each saluran group
      let saluranCounter = 1;
      for (const [saluranNama, features] of saluranGroups.entries()) {
        if (!saluranNama || saluranNama === 'Unknown' || saluranNama === '') continue;

        const firstFeature = features[0];
        const props = firstFeature.properties;
        
        // Calculate total length
        const totalLength = features.reduce((sum, f) => {
          const len = parseFloat(f.properties.panjang_sa || '0');
          return sum + (isNaN(len) ? 0 : len);
        }, 0);

        // Determine jenis (type) from k_aset or nomenklatur
        let jenis = 'primer';
        if (props.k_aset === 'S02' || props.nomenklatu?.includes('RS')) {
          jenis = 'sekunder';
        } else if (props.k_aset === 'S03' || props.nomenklatu?.includes('RT')) {
          jenis = 'tersier';
        }

        // Create saluran
        const { data: saluran, error: saluranError } = await supabase
          .from('saluran')
          .insert({
            daerah_irigasi_id: diId,
            no_saluran: `SAL${String(saluranCounter).padStart(3, '0')}`,
            nama: saluranNama,
            nomenklatur: props.nomenklatu || '',
            jenis,
            panjang_total: totalLength,
            luas_layanan: parseFloat(props.luas_layan || '0'),
            urutan: saluranCounter,
            geojson: { type: 'FeatureCollection', features },
          })
          .select('id')
          .single();

        if (saluranError) throw saluranError;

        // Create ruas for this saluran
        // Find bangunan on this saluran
        const saluranBangunan: Array<{ id: string; norec: string; coords: number[]; norec_salu: string }> = [];
        for (const feature of bangunanData?.features || []) {
          const props = feature.properties;
          if (props.saluran === saluranNama) {
            const bangunanId = bangunanMap.get(props.norec);
            if (bangunanId) {
              saluranBangunan.push({
                id: bangunanId,
                norec: props.norec,
                coords: feature.geometry.coordinates,
                norec_salu: props.norec_salu
              });
            }
          }
        }

        // Sort bangunan by position along the channel (upstream to downstream)
        // For simplicity, we'll sort by norec_salu
        saluranBangunan.sort((a, b) => {
          const aNum = parseInt(a.norec_salu || '999');
          const bNum = parseInt(b.norec_salu || '999');
          return aNum - bNum;
        });

        // Update bangunan with saluran_id and urutan
        for (let i = 0; i < saluranBangunan.length; i++) {
          await supabase
            .from('bangunan')
            .update({
              saluran_id: saluran.id,
              urutan_di_saluran: i + 1,
            })
            .eq('id', saluranBangunan[i].id);
        }

        // Create ruas between bangunan
        if (saluranBangunan.length > 0) {
          for (let i = 0; i < saluranBangunan.length; i++) {
            const bangunanAwal = saluranBangunan[i];
            const bangunanAkhir = saluranBangunan[i + 1] || null;

            // Calculate ruas length (simplified - in real implementation, use actual geometry)
            let ruasLength = 0;
            if (bangunanAkhir) {
              const dx = bangunanAkhir.coords[0] - bangunanAwal.coords[0];
              const dy = bangunanAkhir.coords[1] - bangunanAwal.coords[1];
              ruasLength = Math.sqrt(dx * dx + dy * dy) * 111000; // rough conversion to meters
            }

            await supabase
              .from('ruas')
              .insert({
                saluran_id: saluran.id,
                no_ruas: `Ruas - ${i + 1}`,
                urutan: i + 1,
                panjang: ruasLength,
                bangunan_awal_id: bangunanAwal.id,
                bangunan_akhir_id: bangunanAkhir?.id || null,
                geojson: null, // Will be populated later with actual geometry
              });
          }
        } else {
          // No bangunan, create single ruas for entire saluran
          await supabase
            .from('ruas')
            .insert({
              saluran_id: saluran.id,
              no_ruas: 'Ruas - 1',
              urutan: 1,
              panjang: totalLength,
              bangunan_awal_id: null,
              bangunan_akhir_id: null,
              geojson: { type: 'FeatureCollection', features },
            });
        }

        saluranCounter++;
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
          jumlah_saluran: saluranGroups.size,
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

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});