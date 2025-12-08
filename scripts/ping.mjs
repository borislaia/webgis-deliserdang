
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required environment variables.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function ping() {
    console.log(`Pinging Supabase project at ${SUPABASE_URL}...`)

    // Simple query to 'daerah_irigasi' just to check connectivity and activity
    // 'head: true' is efficient as it doesn't return data, just count/status
    const { count, error } = await supabase
        .from('daerah_irigasi')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Ping failed:', error.message)
        process.exit(1)
    }

    console.log(`Ping successful. Table 'daerah_irigasi' row count: ${count}`)
}

ping()
