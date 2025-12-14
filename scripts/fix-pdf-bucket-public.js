
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
                const val = valueParts.join('=').trim();
                if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
                if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
            }
        }
    });
}

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makePdfBucketPublic() {
    console.log('🔄 Updating "pdf" bucket to PUBLIC...');

    const { data, error } = await supabase.storage.updateBucket('pdf', {
        public: true
    });

    if (error) {
        console.error('❌ Failed to update bucket:', error.message);
        process.exit(1);
    }

    console.log('✅ Bucket "pdf" is now PUBLIC.');

    // Verify
    const { data: bucket } = await supabase.storage.getBucket('pdf');
    console.log('🔍 Verification:', bucket);
}

makePdfBucketPublic();
