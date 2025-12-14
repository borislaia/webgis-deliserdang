import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeBangunan() {
    const k_di = '12120008';
    const fileName = 'Paya_Bakung_I_Bangunan.json';
    const filePath = `${k_di}/${fileName}`;

    console.log('📥 Downloading Bangunan.json from bucket...\n');

    const { data, error } = await supabase.storage
        .from('geojson')
        .download(filePath);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    const text = await data.text();
    const geojson = JSON.parse(text);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🏗️  ANALISA BANGUNAN IRIGASI DI 12120008');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const features = geojson.features || [];

    console.log(`Total Bangunan: ${features.length}\n`);

    // Group by type
    const typeMap = new Map();
    const saluranMap = new Map();

    features.forEach(f => {
        const props = f.properties || {};
        const type = props.n_aset || props.k_aset || 'Unknown';
        const saluran = props.saluran || 'Unknown';
        const lat = f.geometry?.coordinates?.[1] || 0;
        const lon = f.geometry?.coordinates?.[0] || 0;

        if (!typeMap.has(type)) {
            typeMap.set(type, []);
        }
        typeMap.get(type).push({ ...props, lat, lon });

        if (saluran && saluran !== '') {
            if (!saluranMap.has(saluran)) {
                saluranMap.set(saluran, []);
            }
            saluranMap.get(saluran).push({ ...props, lat, lon });
        }
    });

    console.log('───────────────────────────────────────────────────────────────');
    console.log('1️⃣  DISTRIBUSI PER TIPE BANGUNAN\n');
    console.log('───────────────────────────────────────────────────────────────\n');

    const sortedTypes = Array.from(typeMap.entries()).sort((a, b) => b[1].length - a[1].length);

    sortedTypes.forEach(([type, bangunanList]) => {
        console.log(`${type}:`);
        console.log(`  ├─ Jumlah: ${bangunanList.length}`);

        if (bangunanList.length > 0) {
            const lats = bangunanList.map(b => b.lat);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;

            console.log(`  ├─ Latitude Range: ${minLat.toFixed(6)} - ${maxLat.toFixed(6)}`);
            console.log(`  └─ Avg Latitude: ${avgLat.toFixed(6)}\n`);
        }
    });

    console.log('───────────────────────────────────────────────────────────────');
    console.log('2️⃣  BENDUNG/INTAKE (SUMBER AIR) 🏔️');
    console.log('───────────────────────────────────────────────────────────────\n');

    // Find bendung (intake structures)
    const bendungKeywords = ['bendung', 'intake', 'weir', 'dam'];
    const bendungList = features.filter(f => {
        const nama = (f.properties?.nama || '').toLowerCase();
        const nAset = (f.properties?.n_aset || '').toLowerCase();
        const kAset = (f.properties?.k_aset || '').toLowerCase();
        return bendungKeywords.some(kw =>
            nama.includes(kw) || nAset.includes(kw) || kAset.includes(kw)
        );
    });

    if (bendungList.length > 0) {
        console.log(`Ditemukan ${bendungList.length} bendung/intake:\n`);
        bendungList.forEach((b, idx) => {
            const props = b.properties;
            const coords = b.geometry?.coordinates || [];
            console.log(`Bendung #${idx + 1}:`);
            console.log(`  ├─ Nama: ${props.nama}`);
            console.log(`  ├─ Tipe: ${props.n_aset} (${props.k_aset})`);
            console.log(`  ├─ Saluran: ${props.saluran || 'N/A'}`);
            console.log(`  ├─ Koordinat: [${coords[0]?.toFixed(6)}, ${coords[1]?.toFixed(6)}]`);
            console.log(`  └─ Latitude: ${coords[1]?.toFixed(6)} ⬅️ LOKASI SUMBER AIR\n`);
        });
    } else {
        console.log('⚠️  Tidak ditemukan bangunan dengan kata kunci "bendung"\n');
        console.log('Mencari berdasarkan tipe aset...\n');

        // Try B01 (Bendung code)
        const b01List = features.filter(f => f.properties?.k_aset === 'B01');
        if (b01List.length > 0) {
            console.log(`Ditemukan ${b01List.length} bangunan tipe B01:\n`);
            b01List.forEach((b, idx) => {
                const props = b.properties;
                const coords = b.geometry?.coordinates || [];
                console.log(`Bangunan #${idx + 1}:`);
                console.log(`  ├─ Nama: ${props.nama}`);
                console.log(`  ├─ Tipe: ${props.n_aset}`);
                console.log(`  ├─ Saluran: ${props.saluran || 'N/A'}`);
                console.log(`  └─ Latitude: ${coords[1]?.toFixed(6)}\n`);
            });
        }
    }

    console.log('───────────────────────────────────────────────────────────────');
    console.log('3️⃣  BANGUNAN PER SALURAN (URUTAN HULU-HILIR)');
    console.log('───────────────────────────────────────────────────────────────\n');

    const sortedSaluran = Array.from(saluranMap.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
    );

    sortedSaluran.forEach(([saluranName, bangunanList]) => {
        if (bangunanList.length === 0) return;

        // Sort by norec_salu or norec
        const sorted = bangunanList.sort((a, b) => {
            const aVal = parseInt(a.norec_salu) || parseInt(a.norec) || 0;
            const bVal = parseInt(b.norec_salu) || parseInt(b.norec) || 0;
            return aVal - bVal;
        });

        console.log(`═══════════════════════════════════════════════════════════════`);
        console.log(`Saluran: ${saluranName}`);
        console.log(`═══════════════════════════════════════════════════════════════\n`);

        console.log(`Total Bangunan: ${sorted.length}\n`);

        sorted.forEach((b, idx) => {
            const position = idx === 0 ? '🏔️ HULU (Awal)' :
                idx === sorted.length - 1 ? '🌾 HILIR (Akhir)' :
                    '↕️ Tengah';

            console.log(`[${b.norec_salu || b.norec}] ${position}`);
            console.log(`  ├─ Nama: ${b.nama}`);
            console.log(`  ├─ Tipe: ${b.n_aset}`);
            console.log(`  ├─ Nomenklatur: ${b.nomenklatu}`);
            console.log(`  └─ Latitude: ${b.lat?.toFixed(6)}\n`);
        });

        // Analyze direction
        const firstLat = sorted[0]?.lat || 0;
        const lastLat = sorted[sorted.length - 1]?.lat || 0;
        const delta = lastLat - firstLat;

        console.log(`🌊 ANALISA ARAH ALIRAN:`);
        console.log(`  ├─ Bangunan Pertama (Hulu): Lat ${firstLat.toFixed(6)}`);
        console.log(`  ├─ Bangunan Terakhir (Hilir): Lat ${lastLat.toFixed(6)}`);
        console.log(`  ├─ Delta: ${(delta * 111000).toFixed(2)} meter`);

        if (Math.abs(delta) < 0.001) {
            console.log(`  └─ ↔️ Relatif MENDATAR\n`);
        } else if (delta < 0) {
            console.log(`  └─ ✅ Mengalir ke SELATAN (Hulu di Utara) - NORMAL\n`);
        } else {
            console.log(`  └─ ⚠️  Mengalir ke UTARA (Hulu di Selatan) - PERLU CEK\n`);
        }
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save raw data
    fs.writeFileSync('temp-bangunan-from-bucket.json', JSON.stringify(geojson, null, 2));
    console.log('💾 File bangunan disimpan ke: temp-bangunan-from-bucket.json\n');
}

analyzeBangunan().catch(console.error);
