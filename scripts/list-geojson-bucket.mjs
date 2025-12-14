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

async function listGeojsonBucket() {
    console.log('📂 Listing geojson bucket contents...\n');

    // List root
    const { data: rootFiles, error: rootError } = await supabase.storage
        .from('geojson')
        .list('', { limit: 100 });

    if (rootError) {
        console.error('❌ Error listing root:', rootError.message);
        return;
    }

    console.log(`Found ${rootFiles.length} items in root:\n`);

    for (const item of rootFiles) {
        console.log(`📁 ${item.name}`);

        // If it's a folder (no id means folder), list its contents
        if (!item.id) {
            const { data: subFiles, error: subError } = await supabase.storage
                .from('geojson')
                .list(item.name, { limit: 100 });

            if (!subError && subFiles) {
                subFiles.forEach(file => {
                    console.log(`   └─ 📄 ${file.name} (${Math.round(file.metadata?.size / 1024 || 0)} KB)`);
                });
            }
        }
        console.log('');
    }

    // Specifically check 12120008
    console.log('\n🔍 Checking folder 12120008 specifically...\n');
    const { data: diFiles, error: diError } = await supabase.storage
        .from('geojson')
        .list('12120008', { limit: 100 });

    if (diError) {
        console.error('❌ Error:', diError.message);
    } else if (diFiles && diFiles.length > 0) {
        console.log(`Found ${diFiles.length} files:`);
        diFiles.forEach(file => {
            const size = file.metadata?.size || 0;
            console.log(`  ✓ ${file.name} - ${Math.round(size / 1024)} KB`);
        });
    } else {
        console.log('⚠️  Folder 12120008 is empty or doesn\'t exist');
    }
}

listGeojsonBucket().catch(console.error);
