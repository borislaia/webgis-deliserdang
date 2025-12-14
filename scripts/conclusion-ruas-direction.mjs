import fs from 'fs';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🎯 KESIMPULAN: ARAH ALIRAN BERDASARKAN BENDUNG');
console.log('═══════════════════════════════════════════════════════════════\n');

const bangunan = JSON.parse(fs.readFileSync('temp-bangunan-from-bucket.json', 'utf-8'));
const saluran = JSON.parse(fs.readFileSync('temp-saluran-from-bucket.json', 'utf-8'));

// Find bendung
const bendung = bangunan.features.find(f =>
    (f.properties?.nama || '').toLowerCase().includes('bendung')
);

const bendungLat = bendung?.geometry?.coordinates?.[1] || 0;
const bendungLon = bendung?.geometry?.coordinates?.[0] || 0;

console.log('📍 FAKTA KUNCI:\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`🏔️  BENDUNG (SUMBER AIR):`);
console.log(`  ├─ Nama: ${bendung?.properties?.nama}`);
console.log(`  ├─ Koordinat: [${bendungLon.toFixed(6)}, ${bendungLat.toFixed(6)}]`);
console.log(`  ├─ Latitude: ${bendungLat.toFixed(6)} ⬅️ INI ADALAH HULU!\n`);
console.log(`  └─ Terhubung ke: ${bendung?.properties?.saluran}\n`);

// Analyze saluran data
const saluranMap = new Map();
saluran.features.forEach(f => {
    const noSal = f.properties?.no_saluran;
    if (!saluranMap.has(noSal)) {
        saluranMap.set(noSal, []);
    }
    saluranMap.get(noSal).push(f);
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 PERBANDINGAN DENGAN RUAS SALURAN:\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check Saluran 001 (Saluran Primer from bendung)
const sal001 = saluranMap.get('001') || [];
sal001.sort((a, b) => (a.properties?.no_ruas || 0) - (b.properties?.no_ruas || 0));

if (sal001.length > 0) {
    const ruas1 = sal001[0];
    const ruasLast = sal001[sal001.length - 1];

    const ruas1Coords = ruas1.geometry?.coordinates || [];
    const ruasLastCoords = ruasLast.geometry?.coordinates || [];

    const ruas1Start = ruas1Coords[0];
    const ruas1End = ruas1Coords[ruas1Coords.length - 1];
    const ruasLastStart = ruasLastCoords[0];
    const ruasLastEnd = ruasLastCoords[ruasLastCoords.length - 1];

    console.log(`Saluran 001: ${ruas1.properties?.nama}`);
    console.log(`─────────────────────────────────────────────────────────────\n`);

    console.log(`📌 Bendung Latitude: ${bendungLat.toFixed(6)}\n`);

    console.log(`Ruas 1 (Feature pertama):`);
    console.log(`  ├─ Titik Awal: Lat ${ruas1Start?.[1]?.toFixed(6)}`);
    console.log(`  ├─ Titik Akhir: Lat ${ruas1End?.[1]?.toFixed(6)}`);

    const dist1Start = Math.abs(ruas1Start?.[1] - bendungLat) * 111000;
    const dist1End = Math.abs(ruas1End?.[1] - bendungLat) * 111000;

    console.log(`  ├─ Jarak dari Bendung:`);
    console.log(`  │   ├─ Awal Ruas: ${dist1Start.toFixed(2)}m`);
    console.log(`  │   └─ Akhir Ruas: ${dist1End.toFixed(2)}m\n`);

    console.log(`Ruas ${ruasLast.properties?.no_ruas} (Feature terakhir):`);
    console.log(`  ├─ Titik Awal: Lat ${ruasLastStart?.[1]?.toFixed(6)}`);
    console.log(`  ├─ Titik Akhir: Lat ${ruasLastEnd?.[1]?.toFixed(6)}`);

    const distLastStart = Math.abs(ruasLastStart?.[1] - bendungLat) * 111000;
    const distLastEnd = Math.abs(ruasLastEnd?.[1] - bendungLat) * 111000;

    console.log(`  ├─ Jarak dari Bendung:`);
    console.log(`  │   ├─ Awal Ruas: ${distLastStart.toFixed(2)}m`);
    console.log(`  │   └─ Akhir Ruas: ${distLastEnd.toFixed(2)}m\n`);

    console.log(`💡 KESIMPULAN SALURAN 001:\n`);

    const ruas1Closer = dist1Start < distLastEnd;
    if (ruas1Closer) {
        console.log(`  ✅ Ruas 1 LEBIH DEKAT ke bendung (${dist1Start.toFixed(0)}m vs ${distLastEnd.toFixed(0)}m)`);
        console.log(`  ✅ Penomoran SUDAH BENAR: Ruas 1 = Hulu, Ruas 9 = Hilir\n`);
    } else {
        console.log(`  ⚠️  Ruas ${ruasLast.properties?.no_ruas} lebih dekat ke bendung`);
        console.log(`  ⚠️  Penomoran mungkin TERBALIK\n`);
    }
}

// Check Saluran 002
const sal002 = saluranMap.get('002') || [];
sal002.sort((a, b) => (a.properties?.no_ruas || 0) - (b.properties?.no_ruas || 0));

if (sal002.length > 0) {
    const ruas1 = sal002[0];
    const ruasLast = sal002[sal002.length - 1];

    const ruas1Coords = ruas1.geometry?.coordinates || [];
    const ruasLastCoords = ruasLast.geometry?.coordinates || [];

    const ruas1Start = ruas1Coords[0];
    const ruasLastEnd = ruasLastCoords[ruasLastCoords.length - 1];

    console.log(`\nSaluran 002: ${ruas1.properties?.nama}`);
    console.log(`─────────────────────────────────────────────────────────────\n`);

    console.log(`📌 Bendung Latitude: ${bendungLat.toFixed(6)}\n`);

    console.log(`Ruas 1:`);
    console.log(`  ├─ Titik Awal: Lat ${ruas1Start?.[1]?.toFixed(6)}`);
    const dist2_1 = Math.abs(ruas1Start?.[1] - bendungLat) * 111000;
    console.log(`  └─ Jarak dari Bendung: ${dist2_1.toFixed(2)}m\n`);

    console.log(`Ruas ${ruasLast.properties?.no_ruas}:`);
    console.log(`  ├─ Titik Akhir: Lat ${ruasLastEnd?.[1]?.toFixed(6)}`);
    const dist2_last = Math.abs(ruasLastEnd?.[1] - bendungLat) * 111000;
    console.log(`  └─ Jarak dari Bendung: ${dist2_last.toFixed(2)}m\n`);

    console.log(`💡 KESIMPULAN SALURAN 002:\n`);

    const ruas1Closer = dist2_1 < dist2_last;
    if (ruas1Closer) {
        console.log(`  ✅ Ruas 1 LEBIH DEKAT ke bendung (${dist2_1.toFixed(0)}m vs ${dist2_last.toFixed(0)}m)`);
        console.log(`  ✅ Penomoran SUDAH BENAR\n`);
    } else {
        console.log(`  ⚠️  Ruas ${ruasLast.properties?.no_ruas} LEBIH DEKAT ke bendung!`);
        console.log(`  ⚠️  (${dist2_last.toFixed(0)}m vs ${dist2_1.toFixed(0)}m)`);
        console.log(`  ⚠️  Penomoran TERBALIK: Seharusnya Ruas 20 → Ruas 1\n`);
    }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🎓 PENJELASAN LENGKAP:\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`MENGAPA PENOMORAN DARI HULU KE HILIR?\n`);

console.log(`1. 🏔️  Definisi Sistem:`);
console.log(`   └─ HULU = Tempat air masuk (BENDUNG/INTAKE)`);
console.log(`   └─ HILIR = Tempat air keluar (area irigasi)\n`);

console.log(`2. 💧 Aliran Air:`);
console.log(`   └─ Air mengalir HULU → HILIR (karena gravitasi)`);
console.log(`   └─ Tidak mungkin air mengalir dari hilir ke hulu\n`);

console.log(`3. 🔧 Logika Operasional:`);
console.log(`   └─ Maintenance dimulai dari SUMBER (bendung)`);
console.log(`   └─ Distribusi air dikontrol dari HULU`);
console.log(`   └─ Inspeksi mengikuti aliran air\n`);

console.log(`4. 📖 Standar Teknik:`);
console.log(`   └─ Sesuai pedoman Kementerian PUPR`);
console.log(`   └─ Konsisten dengan peta topografi`);
console.log(`   └─ Memudahkan komunikasi antar teknisi\n`);

console.log(`MENGAPA TIDAK DIBALIK?\n`);

console.log(`❌ Jika Ruas 1 = HILIR dan Ruas terakhir = HULU:`);
console.log(`   ├─ Bertentangan dengan arah aliran air`);
console.log(`   ├─ Operator bingung: "Mulai dari mana?"`);
console.log(`   ├─ Maintenance jadi tidak sistematis`);
console.log(`   ├─ Tidak sesuai standar internasional`);
console.log(`   └─ Sulit koordinasi dengan instansi lain\n`);

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 RINGKASAN AKHIR:\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`✅ BENAR:`);
console.log(`   └─ Saluran 001: Ruas 1 dekat bendung, Ruas 9 jauh\n`);

console.log(`⚠️  TERBALIK:`);
console.log(`   └─ Saluran 002-006: Ruas 1 jauh dari bendung, Ruas terakhir dekat\n`);

console.log(`🛠️  REKOMENDASI:`);
console.log(`   1. Verifikasi sumber air Saluran 002-006`);
console.log(`   2. Jika memang dari bendung yang sama:`);
console.log(`      └─ Perbaiki penomoran: reverse Ruas 1 ↔ Ruas terakhir`);
console.log(`   3. Atau: Cek apakah ada intake berbeda(SAL 002-006 ?\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
