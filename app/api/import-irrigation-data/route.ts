import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type BangunanFeature = {
  type: string
  geometry: { type: string; coordinates: number[] }
  properties: {
    id_di: string
    k_di: string
    n_di: string
    nama: string
    nomenklatu: string
    k_aset: string
    n_aset: string
    norec: string
    norec_salu: string
    saluran: string
  }
}

type SaluranFeature = {
  type: string
  geometry: { type: string; coordinates: number[][] }
  properties: {
    id_di: string
    k_di: string
    n_di: string
    nama: string
    nomenklatu: string
    k_aset: string
    n_aset: string
    panjang_sa: string
    luas_layan: string
    norec: string
    saluran: string
  }
}

type FungsionalFeature = {
  type: string
  geometry: { type: string; coordinates: number[][][][] }
  properties: {
    NAMA_DI: string
    LUAS_HA: number
    Thn_Dat: string
    Kondisi: string
    Kecamatan: string
    Desa_Kel: string
    Smb_Air: string
    PANJANG_SP: number
    PANJANG_SS: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { action, k_di, bangunanData, saluranData, fungsionalData } = await req.json()

    if (action !== 'import') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const diProps = fungsionalData?.features?.[0]?.properties

    // Check existing DI
    const { data: existingDI, error: checkError } = await supabase
      .from('daerah_irigasi')
      .select('id')
      .eq('k_di', k_di)
      .maybeSingle()
    if (checkError) throw checkError

    let diId: string
    if (existingDI) {
      const { data: updated, error } = await supabase
        .from('daerah_irigasi')
        .update({
          n_di: diProps?.NAMA_DI || '',
          luas_ha: diProps?.LUAS_HA || 0,
          kecamatan: diProps?.Kecamatan || '',
          desa_kel: diProps?.Desa_Kel || '',
          sumber_air: diProps?.Smb_Air || '',
          tahun_data: diProps?.Thn_Dat || '',
          kondisi: diProps?.Kondisi || '',
          panjang_sp: diProps?.PANJANG_SP || 0,
          panjang_ss: diProps?.PANJANG_SS || 0,
        })
        .eq('k_di', k_di)
        .select('id')
        .single()
      if (error) throw error
      diId = updated!.id
    } else {
      const { data: created, error } = await supabase
        .from('daerah_irigasi')
        .insert({
          k_di,
          n_di: diProps?.NAMA_DI || '',
          luas_ha: diProps?.LUAS_HA || 0,
          kecamatan: diProps?.Kecamatan || '',
          desa_kel: diProps?.Desa_Kel || '',
          sumber_air: diProps?.Smb_Air || '',
          tahun_data: diProps?.Thn_Dat || '',
          kondisi: diProps?.Kondisi || '',
          panjang_sp: diProps?.PANJANG_SP || 0,
          panjang_ss: diProps?.PANJANG_SS || 0,
        })
        .select('id')
        .single()
      if (error) throw error
      diId = created!.id
    }

    const bangunanMap = new Map<string, string>()
    if (bangunanData?.features) {
      for (const feature of bangunanData.features as BangunanFeature[]) {
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const { data, error } = await supabase
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
          .single()
        if (error) throw error
        bangunanMap.set(props.norec, data!.id)
      }
    }

    // Group saluran
    const saluranGroups = new Map<string, SaluranFeature[]>()
    if (saluranData?.features) {
      for (const feature of saluranData.features as SaluranFeature[]) {
        const nama = feature.properties.nama || feature.properties.saluran || 'Unknown'
        if (!saluranGroups.has(nama)) saluranGroups.set(nama, [])
        saluranGroups.get(nama)!.push(feature)
      }
    }

    let saluranCounter = 1
    for (const [saluranNama, features] of saluranGroups.entries()) {
      if (!saluranNama || saluranNama === 'Unknown') continue
      const props = features[0].properties
      const totalLength = features.reduce((sum, f) => sum + (parseFloat(f.properties.panjang_sa || '0') || 0), 0)
      let jenis: 'primer' | 'sekunder' | 'tersier' = 'primer'
      if (props.k_aset === 'S02' || props.nomenklatu?.includes('RS')) jenis = 'sekunder'
      else if (props.k_aset === 'S03' || props.nomenklatu?.includes('RT')) jenis = 'tersier'

      const { data: saluran, error: saluranError } = await supabase
        .from('saluran')
        .insert({
          daerah_irigasi_id: diId,
          no_saluran: `SAL${String(saluranCounter).padStart(3, '0')}`,
          nama: saluranNama,
          nomenklatur: props.nomenklatu || '',
          jenis,
          panjang_total: totalLength,
          luas_layanan: parseFloat(props.luas_layan || '0') || 0,
          urutan: saluranCounter,
          geojson: { type: 'FeatureCollection', features },
        })
        .select('id')
        .single()
      if (saluranError) throw saluranError

      const saluranBangunan: Array<{ id: string; norec: string; coords: number[]; norec_salu: string }>=[]
      for (const feature of bangunanData?.features || []) {
        const propsB = (feature as BangunanFeature).properties
        if (propsB.saluran === saluranNama) {
          const bangunanId = bangunanMap.get(propsB.norec)
          if (bangunanId) {
            saluranBangunan.push({ id: bangunanId, norec: propsB.norec, coords: (feature as BangunanFeature).geometry.coordinates, norec_salu: propsB.norec_salu })
          }
        }
      }

      saluranBangunan.sort((a, b) => (parseInt(a.norec_salu || '999') - parseInt(b.norec_salu || '999')))

      for (let i = 0; i < saluranBangunan.length; i++) {
        await supabase
          .from('bangunan')
          .update({ saluran_id: saluran.id, urutan_di_saluran: i + 1 })
          .eq('id', saluranBangunan[i].id)
      }

      if (saluranBangunan.length > 0) {
        for (let i = 0; i < saluranBangunan.length; i++) {
          const awal = saluranBangunan[i]
          const akhir = saluranBangunan[i + 1] || null
          let ruasLength = 0
          if (akhir) {
            const dx = akhir.coords[0] - awal.coords[0]
            const dy = akhir.coords[1] - awal.coords[1]
            ruasLength = Math.sqrt(dx * dx + dy * dy) * 111000
          }
          await supabase.from('ruas').insert({
            saluran_id: saluran.id,
            no_ruas: `Ruas - ${i + 1}`,
            urutan: i + 1,
            panjang: ruasLength,
            bangunan_awal_id: awal.id,
            bangunan_akhir_id: akhir?.id || null,
            geojson: null,
          })
        }
      } else {
        await supabase.from('ruas').insert({
          saluran_id: saluran.id,
          no_ruas: 'Ruas - 1',
          urutan: 1,
          panjang: totalLength,
          bangunan_awal_id: null,
          bangunan_akhir_id: null,
          geojson: { type: 'FeatureCollection', features },
        })
      }

      saluranCounter++
    }

    if (fungsionalData?.features) {
      for (const feature of fungsionalData.features as FungsionalFeature[]) {
        const props = feature.properties
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
        })
      }
    }

    const { count: salCount } = await supabase
      .from('saluran')
      .select('id', { count: 'exact', head: true })
      .eq('daerah_irigasi_id', diId)
    const { count: bangCount } = await supabase
      .from('bangunan')
      .select('id', { count: 'exact', head: true })
      .eq('daerah_irigasi_id', diId)

    await supabase.from('daerah_irigasi').update({
      jumlah_saluran: salCount || 0,
      jumlah_bangunan: bangCount || 0,
    }).eq('id', diId)

    return NextResponse.json({ success: true, daerah_irigasi_id: diId })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
