'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteFileAdmin(bucketName: string, filePath: string) {
    console.log('=== SERVER ACTION: DELETE FILE ===')
    console.log('Bucket:', bucketName)
    console.log('Path:', filePath)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Supabase URL:', supabaseUrl ? 'EXISTS' : 'MISSING')
    console.log('Service Key:', supabaseServiceKey ? `EXISTS (${supabaseServiceKey.substring(0, 20)}...)` : 'MISSING')

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing credentials')
        return { success: false, error: 'Server configuration error: Missing credentials' }
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        console.log('Calling supabase.storage.from().remove()...')
        const { data, error } = await supabase.storage.from(bucketName).remove([filePath])

        console.log('Supabase Response:')
        console.log('  - Data:', JSON.stringify(data))
        console.log('  - Error:', error ? JSON.stringify(error) : 'null')

        if (error) {
            console.error('❌ Supabase returned error:', error)
            return { success: false, error: error.message }
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No data returned (file might not exist)')
            return { success: false, error: 'File tidak ditemukan atau sudah terhapus' }
        }

        console.log('✅ Delete successful')
        return { success: true, data }
    } catch (err: any) {
        console.error('❌ Exception in deleteFileAdmin:', err)
        return { success: false, error: err.message }
    }
}
