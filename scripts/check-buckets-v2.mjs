import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...parts] = trimmed.split('=')
        if (key && parts.length > 0) {
            env[key.trim()] = parts.join('=').trim()
        }
    }
})

// PREFER SERVICE ROLE for admin tasks
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key)

async function checkBuckets() {
    console.log('Using key:', key ? key.substring(0, 10) + '...' : 'NONE')
    console.log('Checking storage buckets...')
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error.message)
    } else {
        console.log('Buckets found:', data.map(b => `${b.name} (public: ${b.public})`))

        const required = ['geojson', 'images', 'pdf']
        required.forEach(req => {
            const found = data.find(b => b.name === req)
            if (!found) {
                console.log(`❌ MISSING bucket: ${req}`)
            } else {
                console.log(`✅ Found bucket: ${req}`)
            }
        })
    }
}

checkBuckets()
