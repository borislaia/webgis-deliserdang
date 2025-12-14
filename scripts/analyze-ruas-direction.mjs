import fs from 'fs';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🧭 ANALISA ARAH ALIRAN: RUAS 1 vs RUAS TERAKHIR');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load file
const geojson = JSON.parse(fs.readFileSync('temp-saluran-from-bucket.json', 'utf-8'));
const features = geojson.features || [];

// Group by saluran
const saluranMap = new Map();

features.forEach(f => {
    const noSaluran = f.properties?.no_saluran || 'unknown';
    if (!saluranMap.has(noSaluran)) {
        saluranMap.set(noSaluran, []);
    }
    saluranMap.get(noSaluran).push(f);
});

// Analyze each saluran
const saluranList = Array.from(saluranMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
);

function getFirstAndLastCoord(coords) {
    if (!coords || coords.length === 0) return { first: null, last: null };
    return {
        first: coords[0],
        last: coords[coords.length - 1]
    };
}

function calculateElevation(lat, lon) {
    // Estimasi elevasi berdasarkan latitude (di Sumatera Utara)
    // Semakin ke utara (latitude lebih besar), biasanya elevasi lebih tinggi
    // Ini hanya estimasi kasar untuk pola geografis
    return lat * 1000; // Pseudo-elevation
}

console.log('───────────────────────────────────────────────────────────────');
console.log('📊 ANALISA PER SALURAN\n');
console.log('───────────────────────────────────────────────────────────────\n');

const results = [];

saluranList.forEach(([noSaluran, ruasList]) => {
    const nama = ruasList[0]?.properties?.nama || 'N/A';

    // Sort by no_ruas
    ruasList.sort((a, b) => {
        const rA = a.properties?.no_ruas || 0;
        const rB = b.properties?.no_ruas || 0;
        return rA - rB;
    });

    const ruas1 = ruasList[0];
    const ruasLast = ruasList[ruasList.length - 1];

    const coords1 = ruas1?.geometry?.coordinates || [];
    const coordsLast = ruasLast?.geometry?.coordinates || [];

    const { first: start1, last: end1 } = getFirstAndLastCoord(coords1);
    const { first: startLast, last: endLast } = getFirstAndLastCoord(coordsLast);

    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`Saluran ${noSaluran}: ${nama}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    console.log(`📍 RUAS 1 (Awal Saluran):`);
    console.log(`  ├─ No Ruas: ${ruas1.properties?.no_ruas}`);
    console.log(`  ├─ Titik Awal: [${start1?.[0].toFixed(6)}, ${start1?.[1].toFixed(6)}]`);
    console.log(`  ├─ Titik Akhir: [${end1?.[0].toFixed(6)}, ${end1?.[1].toFixed(6)}]`);
    console.log(`  ├─ Latitude Range: ${start1?.[1].toFixed(6)} → ${end1?.[1].toFixed(6)}`);

    const deltaLat1 = end1?.[1] - start1?.[1];
    const deltaLon1 = end1?.[0] - start1?.[0];
    const direction1 = deltaLat1 > 0 ? '🔼 Ke Utara' : deltaLat1 < 0 ? '🔽 Ke Selatan' : '↔️ Mendatar';

    console.log(`  └─ Arah Aliran: ${direction1} (ΔLat: ${(deltaLat1 * 111000).toFixed(2)}m)\n`);

    console.log(`📍 RUAS ${ruasLast.properties?.no_ruas} (Akhir Saluran):`);
    console.log(`  ├─ No Ruas: ${ruasLast.properties?.no_ruas}`);
    console.log(`  ├─ Titik Awal: [${startLast?.[0].toFixed(6)}, ${startLast?.[1].toFixed(6)}]`);
    console.log(`  ├─ Titik Akhir: [${endLast?.[0].toFixed(6)}, ${endLast?.[1].toFixed(6)}]`);
    console.log(`  ├─ Latitude Range: ${startLast?.[1].toFixed(6)} → ${endLast?.[1].toFixed(6)}`);

    const deltaLatLast = endLast?.[1] - startLast?.[1];
    const deltaLonLast = endLast?.[0] - startLast?.[0];
    const directionLast = deltaLatLast > 0 ? '🔼 Ke Utara' : deltaLatLast < 0 ? '🔽 Ke Selatan' : '↔️ Mendatar';

    console.log(`  └─ Arah Aliran: ${directionLast} (ΔLat: ${(deltaLatLast * 111000).toFixed(2)}m)\n`);

    // Compare overall direction
    const overallStartLat = start1?.[1];
    const overallEndLat = endLast?.[1];
    const overallDelta = overallEndLat - overallStartLat;

    console.log(`🌊 ARAH ALIRAN KESELURUHAN SALURAN:`);
    console.log(`  ├─ Dari Latitude: ${overallStartLat?.toFixed(6)} (Ruas 1 awal)`);
    console.log(`  ├─ Ke Latitude: ${overallEndLat?.toFixed(6)} (Ruas ${ruasLast.properties?.no_ruas} akhir)`);
    console.log(`  ├─ Delta: ${(overallDelta * 111000).toFixed(2)} meter`);

    const overallDirection = overallDelta > 0
        ? '🔼 HULU (Utara) → HILIR (Selatan) ❌'
        : overallDelta < 0
            ? '🔽 HULU (Selatan) → HILIR (Utara) ❌'
            : '↔️ Mendatar';

    const isCorrect = overallDelta < 0; // Water flows downstream (south in this case)

    console.log(`  └─ Arah: ${overallDirection}\n`);

    // Check if numbering suggests upstream to downstream
    console.log(`💡 INTERPRETASI:`);
    if (Math.abs(overallDelta) < 0.001) {
        console.log(`  └─ Saluran ini relatif MENDATAR (perbedaan elevasi kecil)\n`);
    } else if (overallDelta < 0) {
        console.log(`  └─ ✅ Penomoran mengikuti HULU (Latitude tinggi) → HILIR (Latitude rendah)\n`);
    } else {
        console.log(`  └─ ⚠️  Penomoran berlawanan dengan pola geografis umum\n`);
    }

    results.push({
        no_saluran: noSaluran,
        nama: nama,
        ruas_count: ruasList.length,
        ruas1_start_lat: start1?.[1],
        ruas1_end_lat: end1?.[1],
        ruasLast_start_lat: startLast?.[1],
        ruasLast_end_lat: endLast?.[1],
        overall_delta_lat: overallDelta,
        overall_delta_meters: overallDelta * 111000,
        follows_upstream_downstream: overallDelta < 0
    });
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📋 RINGKASAN ARAH ALIRAN\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('| Saluran | Nama | Δ Lat | Arah | Pattern |');
console.log('|---------|------|-------|------|---------|');

results.forEach(r => {
    const dir = r.overall_delta_lat < 0 ? 'Utara→Selatan' : r.overall_delta_lat > 0 ? 'Selatan→Utara' : 'Mendatar';
    const pattern = r.follows_upstream_downstream ? '✅ Hulu→Hilir' : '⚠️  Berlawanan';
    console.log(`| ${r.no_saluran} | ${r.nama.substring(0, 15).padEnd(15)} | ${r.overall_delta_meters.toFixed(1).padStart(7)}m | ${dir.padEnd(16)} | ${pattern} |`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎓 PENJELASAN: KONSEP HULU - HILIR\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Dalam sistem irigasi:`);
console.log(`  1. 🏔️  HULU (Upstream) = Titik awal air (bendung/intake)`);
console.log(`  2. 🌾 HILIR (Downstream) = Titik tujuan (sawah/area irigasi)`);
console.log(`  3. 💧 Air mengalir dari HULU → HILIR (gravitasi)\n`);

console.log(`Penomoran Ruas:`);
console.log(`  • Ruas 1 = Paling dekat dengan SUMBER AIR (bendung)`);
console.log(`  • Ruas terakhir = Paling jauh dari sumber (ujung saluran)\n`);

console.log(`Mengapa tidak dibalik?`);
console.log(`  ❌ Jika Ruas 1 di hilir dan Ruas akhir di hulu:`);
console.log(`     └─ Bertentangan dengan logika aliran air`);
console.log(`     └─ Menyulitkan pengelolaan (maintenance dari hulu)`);
console.log(`     └─ Tidak sesuai standar teknik irigasi\n`);

const correctCount = results.filter(r => r.follows_upstream_downstream).length;
console.log(`Hasil Analisa:`);
console.log(`  ✅ ${correctCount}/${results.length} saluran mengikuti pola Hulu→Hilir`);
console.log(`  ⚠️  ${results.length - correctCount}/${results.length} saluran memiliki pola berbeda\n`);

console.log('💾 Hasil detail disimpan ke: analysis-ruas-direction.json\n');

// Save results
fs.writeFileSync('analysis-ruas-direction.json', JSON.stringify({
    analyzed_at: new Date().toISOString(),
    summary: {
        total_saluran: results.length,
        follows_pattern: correctCount,
        opposite_pattern: results.length - correctCount
    },
    details: results
}, null, 2));
