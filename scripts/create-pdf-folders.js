/**
 * Script to create folders for each 'k_di' inside the 'pdf' bucket
 * 
 * Usage: node scripts/create-pdf-folders.js
 */

const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please make sure .env.local file exists with:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('🔑 Using', supabaseServiceKey.substring(0, 20) + '...',
    supabaseServiceKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? '(Service Role Key)' : '(Anon Key)');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPdfFolders() {
    console.log('🚀 Starting to create PDF folders...\n');

    try {
        // 0. Check if 'pdf' bucket exists
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.warn(`⚠️ Could not list buckets: ${bucketError.message}. Proceeding anyway...`);
        } else {
            const pdfBucket = buckets.find(b => b.name === 'pdf');
            if (!pdfBucket) {
                console.log('⚠️ Bucket "pdf" not found. Attempting to create it...');
                const { data: newBucket, error: createError } = await supabase.storage.createBucket('pdf', {
                    public: true // Assuming public like images
                });
                if (createError) {
                    throw new Error(`Failed to create bucket "pdf": ${createError.message}`);
                }
                console.log('✅ Bucket "pdf" created successfully.');
            }
        }

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

        // 2. Create folder for each DI inside 'pdf' bucket
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const di of diList) {
            // We create a folder by uploading a placeholder file
            const folderPath = `${di.k_di}/.emptyFolderPlaceholder`;

            console.log(`📁 Creating folder for ${di.k_di} (${di.n_di})...`);

            // Check if folder already exists (by checking for any file in that prefix)
            const { data: existingFiles } = await supabase.storage
                .from('pdf')
                .list(`${di.k_di}`, { limit: 1 });

            if (existingFiles && existingFiles.length > 0) {
                console.log(`   ⏭️  Folder already exists (or has content), skipping`);
                skipCount++;
                continue;
            }

            // Create placeholder file to establish the folder
            const placeholderContent = Buffer.from('');
            const { error: uploadError } = await supabase.storage
                .from('pdf')
                .upload(folderPath, placeholderContent, {
                    contentType: 'text/plain',
                    upsert: false
                });

            if (uploadError) {
                // Ignore "The resource already exists" error effectively if we raced
                if (uploadError.statusCode === '409' || uploadError.error === 'Duplicate' || uploadError.message.includes('already exists')) {
                    console.log(`   ⏭️  Folder created (concurrently), skipping`);
                    skipCount++;
                } else {
                    console.log(`   ❌ Error: ${uploadError.message}`);
                    errorCount++;
                }
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

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
createPdfFolders()
    .then(() => {
        console.log('\n✨ Script completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
