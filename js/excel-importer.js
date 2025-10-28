import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let supabase;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Parse Excel file and return data as JSON
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Parse all sheets
        const sheets = {};
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: ''
          });
        });

        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import data from Excel to Supabase
 */
export async function importExcelToSupabase(excelData) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [],
    imported: {}
  };

  try {
    // Process each sheet
    for (const [sheetName, rows] of Object.entries(excelData)) {
      console.log(`Processing sheet: ${sheetName}, rows: ${rows.length}`);

      // Detect what type of data this sheet contains
      if (sheetName.toLowerCase().includes('daerah irigasi') ||
          sheetName.toLowerCase().includes('di')) {
        results.imported.daerah_irigasi = await importDaerahIrigasi(rows);
      } else if (sheetName.toLowerCase().includes('saluran')) {
        results.imported.saluran = await importSaluran(rows);
      } else if (sheetName.toLowerCase().includes('bangunan')) {
        results.imported.bangunan = await importBangunan(rows);
      } else {
        // Try to auto-detect based on columns
        const columns = Object.keys(rows[0] || {});
        if (columns.some(col => col.toLowerCase().includes('k_di') || col.toLowerCase().includes('kode_di'))) {
          results.imported.daerah_irigasi = await importDaerahIrigasi(rows);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error importing Excel:', error);
    throw error;
  }
}

/**
 * Import Daerah Irigasi data
 */
async function importDaerahIrigasi(rows) {
  const imported = [];
  const errors = [];

  for (const row of rows) {
    try {
      // Map Excel columns to database columns
      const diData = {
        k_di: row['Kode DI'] || row['k_di'] || row['KODE_DI'] || '',
        n_di: row['Nama DI'] || row['n_di'] || row['NAMA_DI'] || '',
        luas_ha: parseFloat(row['Luas (Ha)'] || row['luas_ha'] || row['LUAS_HA'] || 0),
        kecamatan: row['Kecamatan'] || row['kecamatan'] || row['KECAMATAN'] || '',
        desa_kel: row['Desa/Kel'] || row['desa_kel'] || row['DESA_KEL'] || '',
        sumber_air: row['Sumber Air'] || row['sumber_air'] || row['SUMBER_AIR'] || '',
        tahun_data: String(row['Tahun'] || row['tahun_data'] || row['TAHUN'] || ''),
        kondisi: row['Kondisi'] || row['kondisi'] || row['KONDISI'] || '',
        panjang_sp: parseFloat(row['Panjang SP'] || row['panjang_sp'] || row['PANJANG_SP'] || 0),
        panjang_ss: parseFloat(row['Panjang SS'] || row['panjang_ss'] || row['PANJANG_SS'] || 0),
      };

      // Skip empty rows
      if (!diData.k_di) continue;

      // Check if already exists
      const { data: existing } = await supabase
        .from('daerah_irigasi')
        .select('id')
        .eq('k_di', diData.k_di)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('daerah_irigasi')
          .update(diData)
          .eq('k_di', diData.k_di);

        if (error) throw error;
        imported.push({ action: 'updated', k_di: diData.k_di });
      } else {
        // Insert
        const { error } = await supabase
          .from('daerah_irigasi')
          .insert(diData);

        if (error) throw error;
        imported.push({ action: 'inserted', k_di: diData.k_di });
      }
    } catch (error) {
      errors.push({ row, error: error.message });
    }
  }

  return { imported, errors };
}

/**
 * Import Saluran data
 */
async function importSaluran(rows) {
  const imported = [];
  const errors = [];

  for (const row of rows) {
    try {
      // Get daerah_irigasi_id first
      const k_di = row['Kode DI'] || row['k_di'] || '';
      if (!k_di) continue;

      const { data: di } = await supabase
        .from('daerah_irigasi')
        .select('id')
        .eq('k_di', k_di)
        .maybeSingle();

      if (!di) {
        errors.push({ row, error: 'Daerah Irigasi not found' });
        continue;
      }

      const saluranData = {
        daerah_irigasi_id: di.id,
        no_saluran: row['No Saluran'] || row['no_saluran'] || '',
        nama: row['Nama Saluran'] || row['nama'] || '',
        nomenklatur: row['Nomenklatur'] || row['nomenklatur'] || '',
        jenis: row['Jenis'] || row['jenis'] || 'primer',
        panjang_total: parseFloat(row['Panjang'] || row['panjang_total'] || 0),
        luas_layanan: parseFloat(row['Luas Layanan'] || row['luas_layanan'] || 0),
        urutan: parseInt(row['Urutan'] || row['urutan'] || 0),
      };

      if (!saluranData.nama) continue;

      const { error } = await supabase
        .from('saluran')
        .insert(saluranData);

      if (error) throw error;
      imported.push({ action: 'inserted', nama: saluranData.nama });
    } catch (error) {
      errors.push({ row, error: error.message });
    }
  }

  return { imported, errors };
}

/**
 * Import Bangunan data
 */
async function importBangunan(rows) {
  const imported = [];
  const errors = [];

  for (const row of rows) {
    try {
      const k_di = row['Kode DI'] || row['k_di'] || '';
      if (!k_di) continue;

      const { data: di } = await supabase
        .from('daerah_irigasi')
        .select('id')
        .eq('k_di', k_di)
        .maybeSingle();

      if (!di) {
        errors.push({ row, error: 'Daerah Irigasi not found' });
        continue;
      }

      const bangunanData = {
        daerah_irigasi_id: di.id,
        nama: row['Nama Bangunan'] || row['nama'] || '',
        nomenklatur: row['Nomenklatur'] || row['nomenklatur'] || '',
        k_aset: row['Kode Aset'] || row['k_aset'] || '',
        n_aset: row['Nama Aset'] || row['n_aset'] || '',
        tipe: row['Tipe'] || row['tipe'] || '',
        latitude: parseFloat(row['Latitude'] || row['latitude'] || 0),
        longitude: parseFloat(row['Longitude'] || row['longitude'] || 0),
        elevation: parseFloat(row['Elevation'] || row['elevation'] || 0),
      };

      if (!bangunanData.nama) continue;

      const { error } = await supabase
        .from('bangunan')
        .insert(bangunanData);

      if (error) throw error;
      imported.push({ action: 'inserted', nama: bangunanData.nama });
    } catch (error) {
      errors.push({ row, error: error.message });
    }
  }

  return { imported, errors };
}

/**
 * Load Excel file from server
 */
export async function loadExcelFromServer(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    const sheets = {};
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: ''
      });
    });

    return sheets;
  } catch (error) {
    console.error('Error loading Excel from server:', error);
    throw error;
  }
}
