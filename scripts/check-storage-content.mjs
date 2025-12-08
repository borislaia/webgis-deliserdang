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

async function checkContent() {
    console.log('Checking "geojson" bucket content...')
    const { data: geojsonFiles, error: geojsonError } = await supabase
        .storage
        .from('geojson')
        .list()

    if (geojsonError) {
        console.error('Error listing "geojson":', geojsonError.message)
    } else {
        console.log(`"geojson" bucket root items: ${geojsonFiles.length}`)
        geojsonFiles.forEach(item => {
            console.log(` - ${item.name} (${item.metadata ? 'File' : 'Folder?'})`)
            // If it looks like a folder (no extension, integer-like), try to list inside
            if (!item.name.includes('.')) {
                supabase.storage.from('geojson').list(item.name).then(({ data }) => {
                    if (data && data.length > 0) {
                        console.log(`   Inside ${item.name}:`, data.map(f => f.name).join(', '))
                    } else {
                        console.log(`   Inside ${item.name}: [Empty or Error]`)
                    }
                })
            }
        })
    }

    console.log('Checking "images" bucket content...')
    const { data: imgFiles, error: imgError } = await supabase
        .storage
        .from('images')
        .list()

    if (imgError) {
        console.error('Error listing "images":', imgError.message)
    } else {
        console.log(`"images" bucket contains ${imgFiles.length} items.`)
        if (imgFiles.length > 0) console.log('Sample:', imgFiles[0].name)
    }
}

checkContent()
