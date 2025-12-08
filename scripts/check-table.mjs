import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.trim()
    }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function checkData() {
    console.log('Fetching rows from "daerah_irigasi"...')
    const { data, error } = await supabase
        .from('daerah_irigasi')
        .select('*')
        .limit(5)

    if (error) {
        console.error('Error fetching data:', error.message)
    } else {
        console.log(`Success. Rows found: ${data.length}`)
        if (data.length > 0) {
            console.log('Sample row:', data[0])
        } else {
            console.log('Table is empty.')
        }
    }
}

checkData()
