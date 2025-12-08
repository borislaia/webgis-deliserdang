
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yyagythhwzdncantoszf.supabase.co'

async function checkUrl(url, label) {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        console.log(`[${label}] ${url} -> Status: ${res.status}`)
        return res.status === 200
    } catch (e) {
        console.log(`[${label}] Error: ${e.message}`)
        return false
    }
}

async function verify() {
    console.log('Verifying public access to assets...')

    // 1. Check GeoJSON (Verified Path)
    await checkUrl(`${SUPABASE_URL}/storage/v1/object/public/geojson/12120005/Lau_Simeme_Saluran.json`, 'GeoJSON (Real File)')

}

verify()
