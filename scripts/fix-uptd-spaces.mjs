import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixUptdSpaces() {
    console.log('=== Checking current UPTD values ===');

    // 1. Show current values
    const { data: before, error: checkErr } = await supabase
        .from('daerah_irigasi')
        .select('uptd')
        .limit(100);

    if (checkErr) {
        console.error('Error checking data:', checkErr);
        return;
    }

    const uniqueValues = [...new Set(before.map(r => r.uptd))];
    console.log('Current unique UPTD values:', uniqueValues.map(v => `"${v}" (len: ${v?.length})`));

    // 2. Update to trim spaces
    console.log('\n=== Updating UPTD values (removing leading/trailing spaces) ===');

    for (const value of uniqueValues) {
        if (value && value !== value.trim()) {
            const trimmed = value.trim();
            console.log(`Updating "${value}" -> "${trimmed}"`);

            const { error: updateErr, count } = await supabase
                .from('daerah_irigasi')
                .update({ uptd: trimmed })
                .eq('uptd', value);

            if (updateErr) {
                console.error(`Error updating "${value}":`, updateErr);
            } else {
                console.log(`Updated rows for "${value}" -> "${trimmed}"`);
            }
        }
    }

    // 3. Verify
    console.log('\n=== Verifying updated values ===');
    const { data: after } = await supabase
        .from('daerah_irigasi')
        .select('uptd')
        .limit(100);

    const uniqueAfter = [...new Set(after.map(r => r.uptd))];
    console.log('Updated unique UPTD values:', uniqueAfter.map(v => `"${v}" (len: ${v?.length})`));

    console.log('\n✅ Done!');
}

fixUptdSpaces();
