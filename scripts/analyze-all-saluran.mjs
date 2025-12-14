import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DI_LIST = [
    { k_di: '12120005', name: 'Lau_Simeme' },
    { k_di: '12120008', name: 'Paya_Bakung_I' },
    { k_di: '12120009', name: 'Paya_Bakung_II' },
    { k_di: '12120010', name: 'Paya_Bakung_III' },
    { k_di: '12120011', name: 'Sibolangit' },
    { k_di: '12120031', name: 'Buluh_Awar' },
    { k_di: '12120032', name: 'Buluh_Nipes' },
    { k_di: '12120051', name: 'Kota_Datar' },
    { k_di: '12120052', name: 'Kota_Rantang' },
    { k_di: '12120058', name: 'Lantasan_Baru' },
    { k_di: '12120063', name: 'Mba_Ruai' },
    { k_di: '12120066', name: 'Namo_Suro_Baru' },
    { k_di: '12120077', name: 'Rumah_Kinangkung' },
    { k_di: '12120078', name: 'Rumah_Pil-pil' },
    { k_di: '12120087', name: 'Sikeben' }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🔍 ANALISA STRUKTUR DATA SALURAN SEMUA DI');
console.log('═══════════════════════════════════════════════════════════════\n');

async function analyzeDI(di) {
    const filePath = `${di.k_di}/${di.name}_Saluran.json`;

    try {
        const { data, error } = await supabase.storage
            .from('geojson')
            .download(filePath);

        if (error) {
            return {
                k_di: di.k_di,
                name: di.name,
                status: '❌ Error',
                error: error.message
            };
        }

        const text = await data.text();
        const geojson = JSON.parse(text);
        const features = geojson.features || [];

        if (features.length === 0) {
            return {
                k_di: di.k_di,
                name: di.name,
                status: '⚠️  Empty',
                features: 0
            };
        }

        // Analyze first feature
        const first = features[0];
        const props = first.properties || {};

        // Check key fields
        const hasNoSaluran = 'no_saluran' in props;
        const hasNoRuas = 'no_ruas' in props;
        const hasImgUrls = 'img_urls' in props || 'img_url' in props;

        // Get all unique property keys
        const allKeys = new Set();
        features.forEach(f => {
            Object.keys(f.properties || {}).forEach(k => allKeys.add(k));
        });

        // Check if already segmented (many features with no_ruas)
        const featuresWithRuas = features.filter(f => 'no_ruas' in (f.properties || {})).length;
        const isSegmented = featuresWithRuas > features.length * 0.5; // More than 50% have no_ruas

        return {
            k_di: di.k_di,
            name: di.name,
            status: isSegmented ? '✅ Already Segmented' : '📝 Raw Data',
            features: features.length,
            hasNoSaluran,
            hasNoRuas,
            hasImgUrls,
            ruasCount: featuresWithRuas,
            properties: Array.from(allKeys).sort()
        };

    } catch (err) {
        return {
            k_di: di.k_di,
            name: di.name,
            status: '❌ Parse Error',
            error: err.message
        };
    }
}

async function main() {
    console.log('Analyzing all DI Saluran files...\n');

    const results = [];

    for (const di of DI_LIST) {
        process.stdout.write(`Checking ${di.k_di} (${di.name})... `);
        const result = await analyzeDI(di);
        results.push(result);
        console.log(result.status);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RINGKASAN DETAIL\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('| K_DI | Nama | Status | Features | no_saluran | no_ruas | img_urls |');
    console.log('|------|------|--------|----------|------------|---------|----------|');

    results.forEach(r => {
        if (r.status.includes('Error') || r.status.includes('Empty')) {
            console.log(`| ${r.k_di} | ${r.name.substring(0, 15).padEnd(15)} | ${r.status} | - | - | - | - |`);
        } else {
            const noSal = r.hasNoSaluran ? '✅' : '❌';
            const noRuas = r.hasNoRuas ? `✅ (${r.ruasCount})` : '❌';
            const imgs = r.hasImgUrls ? '✅' : '❌';
            console.log(`| ${r.k_di} | ${r.name.substring(0, 15).padEnd(15)} | ${r.status.padEnd(20)} | ${String(r.features).padStart(8)} | ${noSal.padEnd(10)} | ${noRuas.padEnd(11)} | ${imgs.padEnd(8)} |`);
        }
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 KESIMPULAN\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const segmented = results.filter(r => r.status === '✅ Already Segmented');
    const raw = results.filter(r => r.status === '📝 Raw Data');
    const errors = results.filter(r => r.status.includes('Error') || r.status.includes('Empty'));

    console.log(`✅ Already Segmented: ${segmented.length} DI`);
    if (segmented.length > 0) {
        segmented.forEach(r => console.log(`   - ${r.name} (${r.features} features, ${r.ruasCount} ruas)`));
    }
    console.log('');

    console.log(`📝 Need Processing: ${raw.length} DI`);
    if (raw.length > 0) {
        raw.forEach(r => console.log(`   - ${r.name} (${r.features} features)`));
    }
    console.log('');

    if (errors.length > 0) {
        console.log(`❌ Errors: ${errors.length} DI`);
        errors.forEach(r => console.log(`   - ${r.name}: ${r.error || r.status}`));
        console.log('');
    }

    // Check no_saluran specifically
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔑 CHECK: no_saluran Field\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const withNoSaluran = results.filter(r => r.hasNoSaluran);
    const withoutNoSaluran = results.filter(r => r.hasNoSaluran === false);

    console.log(`✅ Has no_saluran: ${withNoSaluran.length}/${results.length} DI`);
    console.log(`❌ Missing no_saluran: ${withoutNoSaluran.length}/${results.length} DI\n`);

    if (withoutNoSaluran.length > 0) {
        console.log('DI yang BELUM punya no_saluran:');
        withoutNoSaluran.forEach(r => {
            console.log(`  - ${r.name}`);
            if (r.properties) {
                console.log(`    Properties: ${r.properties.slice(0, 5).join(', ')}...`);
            }
        });
        console.log('');
    }

    // Show sample properties from raw vs segmented
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📄 SAMPLE PROPERTIES\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (raw.length > 0) {
        const sampleRaw = raw[0];
        console.log(`Raw Data Example: ${sampleRaw.name}`);
        console.log(`  Properties: ${sampleRaw.properties?.join(', ')}\n`);
    }

    if (segmented.length > 0) {
        const sampleSeg = segmented[0];
        console.log(`Segmented Data Example: ${sampleSeg.name}`);
        console.log(`  Properties: ${sampleSeg.properties?.join(', ')}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
