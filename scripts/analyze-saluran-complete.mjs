import fs from 'fs';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  📊 ANALISA LENGKAP FILE GEOJSON SALURAN DI 12120008');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load file
const geojson = JSON.parse(fs.readFileSync('temp-saluran-from-bucket.json', 'utf-8'));

const features = geojson.features || [];

console.log(`✓ Total Features: ${features.length}\n`);

// ═══════════════════════════════════════════════════════════════
// 1. ANALISA PER SALURAN
// ═══════════════════════════════════════════════════════════════

console.log('───────────────────────────────────────────────────────────────');
console.log('1️⃣  BREAKDOWN PER SALURAN');
console.log('───────────────────────────────────────────────────────────────\n');

const saluranMap = new Map();

features.forEach(f => {
    const noSaluran = f.properties?.no_saluran || 'unknown';
    const nama = f.properties?.nama || 'N/A';

    if (!saluranMap.has(noSaluran)) {
        saluranMap.set(noSaluran, {
            no_saluran: noSaluran,
            nama: nama,
            ruas_count: 0,
            ruas_numbers: [],
            total_length: 0,
            has_images: 0,
            image_urls: []
        });
    }

    const sal = saluranMap.get(noSaluran);
    sal.ruas_count++;
    sal.ruas_numbers.push(f.properties?.no_ruas);
    sal.total_length += f.properties?.Shape_Leng || 0;

    if (f.properties?.img_urls) {
        sal.has_images++;
        sal.image_urls.push(f.properties.img_urls);
    }
});

const saluranList = Array.from(saluranMap.values()).sort((a, b) =>
    a.no_saluran.localeCompare(b.no_saluran)
);

saluranList.forEach((sal, idx) => {
    console.log(`Saluran #${idx + 1}: ${sal.no_saluran}`);
    console.log(`  ├─ Nama: ${sal.nama}`);
    console.log(`  ├─ Jumlah Ruas: ${sal.ruas_count}`);
    console.log(`  ├─ Ruas Range: ${Math.min(...sal.ruas_numbers)} - ${Math.max(...sal.ruas_numbers)}`);
    console.log(`  ├─ Total Panjang: ${(sal.total_length * 111000).toFixed(2)} meter`);
    console.log(`  ├─ Ruas dengan Gambar: ${sal.has_images}/${sal.ruas_count}`);
    console.log(`  └─ Coverage: ${((sal.has_images / sal.ruas_count) * 100).toFixed(1)}%\n`);
});

// ═══════════════════════════════════════════════════════════════
// 2. ANALISA PROPERTIES
// ═══════════════════════════════════════════════════════════════

console.log('───────────────────────────────────────────────────────────────');
console.log('2️⃣  STRUKTUR PROPERTIES');
console.log('───────────────────────────────────────────────────────────────\n');

const sampleProps = features[0]?.properties || {};
const propKeys = Object.keys(sampleProps);

console.log('Properties yang tersedia:');
propKeys.forEach((key, idx) => {
    const val = sampleProps[key];
    const type = Array.isArray(val) ? `Array[${val.length}]` : typeof val;
    const sample = typeof val === 'string' && val.length > 50
        ? val.substring(0, 50) + '...'
        : val;

    const prefix = idx === propKeys.length - 1 ? '└─' : '├─';
    console.log(`  ${prefix} ${key.padEnd(15)} : ${type.padEnd(10)} = ${JSON.stringify(sample)}`);
});

// ═══════════════════════════════════════════════════════════════
// 3. ANALISA GEOMETRI
// ═══════════════════════════════════════════════════════════════

console.log('\n───────────────────────────────────────────────────────────────');
console.log('3️⃣  ANALISA GEOMETRI');
console.log('───────────────────────────────────────────────────────────────\n');

const geometryTypes = {};
let totalCoordinates = 0;
let minCoords = Infinity;
let maxCoords = 0;

features.forEach(f => {
    const geomType = f.geometry?.type || 'unknown';
    geometryTypes[geomType] = (geometryTypes[geomType] || 0) + 1;

    const coords = f.geometry?.coordinates?.length || 0;
    totalCoordinates += coords;
    minCoords = Math.min(minCoords, coords);
    maxCoords = Math.max(maxCoords, coords);
});

console.log('Tipe Geometri:');
Object.entries(geometryTypes).forEach(([type, count]) => {
    console.log(`  ├─ ${type}: ${count} features`);
});

console.log(`\nStatistik Koordinat:`);
console.log(`  ├─ Total Points: ${totalCoordinates}`);
console.log(`  ├─ Min per Feature: ${minCoords}`);
console.log(`  ├─ Max per Feature: ${maxCoords}`);
console.log(`  └─ Avg per Feature: ${(totalCoordinates / features.length).toFixed(1)}`);

// ═══════════════════════════════════════════════════════════════
// 4. ANALISA IMG_URLS
// ═══════════════════════════════════════════════════════════════

console.log('\n───────────────────────────────────────────────────────────────');
console.log('4️⃣  ANALISA IMG_URLS');
console.log('───────────────────────────────────────────────────────────────\n');

const imgUrlStats = {
    total: 0,
    hasImage: 0,
    noImage: 0,
    uniqueUrls: new Set(),
    urlPatterns: {}
};

features.forEach(f => {
    const imgUrl = f.properties?.img_urls;

    if (imgUrl && imgUrl.trim() !== '') {
        imgUrlStats.hasImage++;
        imgUrlStats.uniqueUrls.add(imgUrl);

        // Extract pattern
        const match = imgUrl.match(/\/([^/]+)\/Ruas - \d+\.(\w+)$/);
        if (match) {
            const folder = match[1];
            const ext = match[2];
            const pattern = `${folder}/*.${ext}`;
            imgUrlStats.urlPatterns[pattern] = (imgUrlStats.urlPatterns[pattern] || 0) + 1;
        }
    } else {
        imgUrlStats.noImage++;
    }
    imgUrlStats.total++;
});

console.log(`Total Features: ${imgUrlStats.total}`);
console.log(`  ├─ Dengan Gambar: ${imgUrlStats.hasImage} (${((imgUrlStats.hasImage / imgUrlStats.total) * 100).toFixed(1)}%)`);
console.log(`  ├─ Tanpa Gambar: ${imgUrlStats.noImage} (${((imgUrlStats.noImage / imgUrlStats.total) * 100).toFixed(1)}%)`);
console.log(`  └─ Unique URLs: ${imgUrlStats.uniqueUrls.size}\n`);

console.log('Pola URL:');
Object.entries(imgUrlStats.urlPatterns).forEach(([pattern, count]) => {
    console.log(`  ├─ ${pattern}: ${count} files`);
});

// ═══════════════════════════════════════════════════════════════
// 5. ANALISA NO_RUAS
// ═══════════════════════════════════════════════════════════════

console.log('\n───────────────────────────────────────────────────────────────');
console.log('5️⃣  ANALISA NO_RUAS');
console.log('───────────────────────────────────────────────────────────────\n');

const ruasNumbers = features.map(f => f.properties?.no_ruas).filter(n => n !== undefined);
const uniqueRuas = [...new Set(ruasNumbers)].sort((a, b) => a - b);

console.log(`Total Ruas Numbers: ${ruasNumbers.length}`);
console.log(`Unique Ruas Numbers: ${uniqueRuas.length}`);
console.log(`Range: ${Math.min(...ruasNumbers)} - ${Math.max(...ruasNumbers)}\n`);

// Check for duplicates
const ruasDuplicates = {};
ruasNumbers.forEach(num => {
    ruasDuplicates[num] = (ruasDuplicates[num] || 0) + 1;
});

const duplicates = Object.entries(ruasDuplicates).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
    console.log('⚠️  Duplikasi Ditemukan:');
    duplicates.forEach(([num, count]) => {
        console.log(`  ├─ Ruas ${num}: muncul ${count} kali`);
    });
    console.log('');
}

// Check for gaps
const gaps = [];
for (let i = Math.min(...ruasNumbers); i <= Math.max(...ruasNumbers); i++) {
    if (!ruasNumbers.includes(i)) {
        gaps.push(i);
    }
}

if (gaps.length > 0) {
    console.log(`⚠️  Gap dalam Penomoran: ${gaps.join(', ')}\n`);
} else {
    console.log(`✓ Penomoran Ruas: Berurutan lengkap\n`);
}

// ═══════════════════════════════════════════════════════════════
// 6. ANALISA PANJANG SALURAN
// ═══════════════════════════════════════════════════════════════

console.log('───────────────────────────────────────────────────────────────');
console.log('6️⃣  STATISTIK PANJANG (Shape_Leng)');
console.log('───────────────────────────────────────────────────────────────\n');

const lengths = features.map(f => f.properties?.Shape_Leng || 0);
const totalLength = lengths.reduce((sum, len) => sum + len, 0);
const avgLength = totalLength / lengths.length;
const minLength = Math.min(...lengths);
const maxLength = Math.max(...lengths);

// Convert to meters (assuming Shape_Leng is in degrees, multiply by ~111km)
const toMeters = (deg) => deg * 111000;

console.log(`Total Panjang: ${toMeters(totalLength).toFixed(2)} meter`);
console.log(`Panjang Rata-rata: ${toMeters(avgLength).toFixed(2)} meter per ruas`);
console.log(`Panjang Terpendek: ${toMeters(minLength).toFixed(2)} meter`);
console.log(`Panjang Terpanjang: ${toMeters(maxLength).toFixed(2)} meter`);

// ═══════════════════════════════════════════════════════════════
// 7. SAMPLE DATA
// ═══════════════════════════════════════════════════════════════

console.log('\n───────────────────────────────────────────────────────────────');
console.log('7️⃣  SAMPLE DATA (3 Features Pertama)');
console.log('───────────────────────────────────────────────────────────────\n');

features.slice(0, 3).forEach((f, idx) => {
    console.log(`Feature #${idx + 1}:`);
    console.log(`  ├─ Saluran: ${f.properties?.no_saluran} (${f.properties?.nama})`);
    console.log(`  ├─ Ruas: ${f.properties?.no_ruas}`);
    console.log(`  ├─ Panjang: ${toMeters(f.properties?.Shape_Leng || 0).toFixed(2)} m`);
    console.log(`  ├─ Coordinates: ${f.geometry?.coordinates?.length || 0} points`);
    console.log(`  ├─ Image: ${f.properties?.img_urls ? '✓' : '✗'}`);
    if (f.properties?.img_urls) {
        const url = f.properties.img_urls;
        const filename = url.split('/').pop();
        console.log(`  │   └─ ${filename}`);
    }
    console.log(`  └─ ID: ${f.properties?.nn || 'N/A'}\n`);
});

// ═══════════════════════════════════════════════════════════════
// 8. RINGKASAN AKHIR
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('📋 RINGKASAN AKHIR');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`✓ Total Features: ${features.length}`);
console.log(`✓ Jumlah Saluran: ${saluranMap.size}`);
console.log(`✓ Total Panjang: ${toMeters(totalLength).toFixed(2)} meter`);
console.log(`✓ Features dengan Gambar: ${imgUrlStats.hasImage}/${imgUrlStats.total} (${((imgUrlStats.hasImage / imgUrlStats.total) * 100).toFixed(1)}%)`);
console.log(`✓ Tipe Geometri: ${Object.keys(geometryTypes).join(', ')}`);
console.log(`✓ Total Koordinat: ${totalCoordinates} points`);

console.log('\n═══════════════════════════════════════════════════════════════\n');

// Export detailed analysis to JSON
const analysis = {
    summary: {
        total_features: features.length,
        total_saluran: saluranMap.size,
        total_length_meters: toMeters(totalLength),
        features_with_images: imgUrlStats.hasImage,
        image_coverage_pct: (imgUrlStats.hasImage / imgUrlStats.total) * 100
    },
    saluran: saluranList,
    geometry_types: geometryTypes,
    image_stats: {
        total: imgUrlStats.total,
        has_image: imgUrlStats.hasImage,
        no_image: imgUrlStats.noImage,
        unique_urls: imgUrlStats.uniqueUrls.size,
        url_patterns: imgUrlStats.urlPatterns
    },
    ruas_stats: {
        total: ruasNumbers.length,
        unique: uniqueRuas.length,
        min: Math.min(...ruasNumbers),
        max: Math.max(...ruasNumbers),
        duplicates: duplicates.map(([num, count]) => ({ ruas: num, count })),
        gaps: gaps
    },
    length_stats: {
        total_meters: toMeters(totalLength),
        avg_meters: toMeters(avgLength),
        min_meters: toMeters(minLength),
        max_meters: toMeters(maxLength)
    }
};

fs.writeFileSync('analysis-saluran-12120008.json', JSON.stringify(analysis, null, 2));
console.log('💾 Analisa detail disimpan ke: analysis-saluran-12120008.json\n');
