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

async function checkSaluranGeoJSON() {
    const k_di = '12120008';
    const fileName = 'Paya_Bakung_I_Saluran.json';
    const filePath = `${k_di}/${fileName}`;

    console.log('📥 Downloading file from Supabase bucket...');
    console.log(`Path: geojson/${filePath}\n`);

    // Download the file
    const { data, error } = await supabase.storage
        .from('geojson')
        .download(filePath);

    if (error) {
        console.error('❌ Error downloading file:', error.message);
        return;
    }

    // Parse JSON
    const text = await data.text();
    const geojson = JSON.parse(text);

    console.log('✅ File downloaded successfully\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 FILE ANALYSIS FOR DI 12120008\n');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Type: ${geojson.type}`);
    console.log(`Total Features: ${geojson.features?.length || 0}`);
    console.log(`File Size: ${Math.round(text.length / 1024)} KB\n`);

    if (geojson.features && geojson.features.length > 0) {
        console.log('───────────────────────────────────────────────────────\n');
        console.log('🔍 ANALYZING PROPERTIES\n');
        console.log('───────────────────────────────────────────────────────\n');

        const firstFeature = geojson.features[0];
        const props = firstFeature.properties || {};

        // Check for key fields
        const hasRuas = 'ruas' in props;
        const hasImgUrls = 'img_urls' in props;
        const hasImgUrl = 'img_url' in props;
        const hasNoSaluran = 'no_saluran' in props;
        const hasFotoUrls = 'foto_urls' in props;

        console.log('Key Fields Status:');
        console.log(`  ├─ no_saluran:  ${hasNoSaluran ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`  ├─ ruas:        ${hasRuas ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`  ├─ img_urls:    ${hasImgUrls ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`  ├─ img_url:     ${hasImgUrl ? '✅ FOUND' : '❌ NOT FOUND'}`);
        console.log(`  └─ foto_urls:   ${hasFotoUrls ? '✅ FOUND' : '❌ NOT FOUND'}\n`);

        console.log('All Properties Found:');
        const propKeys = Object.keys(props);
        propKeys.forEach((key, idx) => {
            const prefix = idx === propKeys.length - 1 ? '└─' : '├─';
            const value = props[key];
            const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
            console.log(`  ${prefix} ${key}: (${type})`);
        });

        console.log('\n───────────────────────────────────────────────────────\n');
        console.log('📄 FIRST FEATURE SAMPLE\n');
        console.log('───────────────────────────────────────────────────────\n');
        console.log(JSON.stringify(firstFeature, null, 2).substring(0, 2000));
        console.log('\n... (truncated)\n');

        // Check if ruas exists and show sample
        if (hasRuas && Array.isArray(props.ruas)) {
            console.log('───────────────────────────────────────────────────────\n');
            console.log(`📐 RUAS DETAILS (Total: ${props.ruas.length})\n`);
            console.log('───────────────────────────────────────────────────────\n');
            props.ruas.slice(0, 3).forEach((ruas, idx) => {
                console.log(`Ruas #${idx + 1}:`);
                console.log(`  ├─ no_ruas: ${ruas.no_ruas || 'N/A'}`);
                console.log(`  ├─ panjang: ${ruas.panjang || 'N/A'} m`);
                console.log(`  └─ has geometry: ${ruas.geojson ? 'Yes' : 'No'}\n`);
            });
            if (props.ruas.length > 3) {
                console.log(`  ... and ${props.ruas.length - 3} more ruas\n`);
            }
        }

        // Check img_urls
        if (hasImgUrls && Array.isArray(props.img_urls)) {
            console.log('───────────────────────────────────────────────────────\n');
            console.log(`🖼️ IMAGE URLs (Total: ${props.img_urls.length})\n`);
            console.log('───────────────────────────────────────────────────────\n');
            props.img_urls.slice(0, 3).forEach((url, idx) => {
                console.log(`  ${idx + 1}. ${url}`);
            });
            if (props.img_urls.length > 3) {
                console.log(`  ... and ${props.img_urls.length - 3} more images\n`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════\n');

        // Save to file for inspection
        const outputPath = 'd:/2025/Projects/webgis-deliserdang/temp-saluran-from-bucket.json';
        fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
        console.log(`💾 Full file saved to: temp-saluran-from-bucket.json\n`);
        console.log('═══════════════════════════════════════════════════════\n');
    }
}

checkSaluranGeoJSON().catch(console.error);
