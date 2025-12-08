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

async function checkBuckets() {
    console.log('Checking storage buckets...')
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error.message)
    } else {
        console.log('Buckets found:', data.map(b => b.name))
        const hasGeojson = data.some(b => b.name === 'geojson')
        const hasImages = data.some(b => b.name === 'images')
        if (!hasGeojson) console.log('MISSING bucket: geojson')
        if (!hasImages) console.log('MISSING bucket: images')
    }
}

checkBuckets()
