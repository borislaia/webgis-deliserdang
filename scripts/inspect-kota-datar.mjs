import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFile() {
    const filePath = '12120051/Kota_Datar_Saluran.json';

    console.log(`📥 Downloading ${filePath}...\n`);

    const { data, error } = await supabase.storage
        .from('geojson')
        .download(filePath);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    const text = await data.text();
    const geojson = JSON.parse(text);

    console.log('File Info:');
    console.log(`  Type: ${geojson.type}`);
    console.log(`  Features: ${geojson.features?.length || 0}`);
    console.log(`  Size: ${text.length} bytes\n`);

    if (geojson.features && geojson.features.length > 0) {
        console.log('First feature properties:');
        const props = geojson.features[0].properties || {};
        console.log(JSON.stringify(props, null, 2));

        console.log('\nAll property keys:');
        console.log(Object.keys(props).join(', '));
    }

    // Save for inspection
    fs.writeFileSync('temp-kota-datar-raw.json', JSON.stringify(geojson, null, 2));
    console.log(`\n💾 Saved to: temp-kota-datar-raw.json`);
}

inspectFile().catch(console.error);
