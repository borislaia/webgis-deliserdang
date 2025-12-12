/**
 * Script to create 'citra' folders inside all 'kode DI' folders in the images bucket
 * 
 * Usage: npx tsx scripts/create-citra-folders.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCitraFolders() {
    console.log('🚀 Starting to create citra folders...\n');

    try {
        // 1. Fetch all DI codes from database
        console.log('📊 Fetching all DI codes from database...');
        const { data: diList, error: dbError } = await supabase
            .from('daerah_irigasi')
            .select('k_di, n_di')
            .order('k_di');

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`);
        }

        if (!diList || diList.length === 0) {
            console.log('⚠️  No irrigation areas found in database');
            return;
        }

        console.log(`✅ Found ${diList.length} irrigation areas\n`);

        // 2. Create 'citra' folder for each DI
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const di of diList) {
            const folderPath = `${di.k_di}/citra/.emptyFolderPlaceholder`;

            console.log(`📁 Creating folder for ${di.k_di} (${di.n_di})...`);

            // Check if folder already exists
            const { data: existingFiles } = await supabase.storage
                .from('images')
                .list(`${di.k_di}/citra`, { limit: 1 });

            if (existingFiles && existingFiles.length > 0) {
                console.log(`   ⏭️  Folder already exists, skipping`);
                skipCount++;
                continue;
            }

            // Create placeholder file to establish the folder
            const placeholderContent = new Blob([''], { type: 'text/plain' });
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(folderPath, placeholderContent, {
                    contentType: 'text/plain',
                    upsert: false
                });

            if (uploadError) {
                console.log(`   ❌ Error: ${uploadError.message}`);
                errorCount++;
            } else {
                console.log(`   ✅ Created successfully`);
                successCount++;
            }
        }

        // 3. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully created: ${successCount} folders`);
        console.log(`⏭️  Skipped (already exists): ${skipCount} folders`);
        console.log(`❌ Errors: ${errorCount} folders`);
        console.log(`📁 Total processed: ${diList.length} irrigation areas`);
        console.log('='.repeat(50));

    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
createCitraFolders()
    .then(() => {
        console.log('\n✨ Script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
