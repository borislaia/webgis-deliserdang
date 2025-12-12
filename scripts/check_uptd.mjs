
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env from .env.local if available (for local testing)
try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
                process.env[key.trim()] = value.trim()
            }
        })
    }
} catch (e) {
    // Ignore error
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required environment variables.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkUptd() {
    console.log(`Checking 'daerah_irigasi' table for 'uptd' column values...`)

    const { data, error } = await supabase
        .from('daerah_irigasi')
        .select('uptd, n_di')
        .not('uptd', 'is', null)

    if (error) {
        console.error('Error fetching data:', error.message)
        process.exit(1)
    }

    // Group by UPTD
    const grouped = {};
    data.forEach(item => {
        const key = item.uptd || 'NULL';
        if (!grouped[key]) grouped[key] = [];
        if (grouped[key].length < 3) grouped[key].push(item.n_di);
    });

    console.log('--- Samples per UPTD ---');
    for (const [uptd, names] of Object.entries(grouped)) {
        console.log(`UPTD [${uptd}]: ${names.join(', ')} ...`);
    }
}

checkUptd()
