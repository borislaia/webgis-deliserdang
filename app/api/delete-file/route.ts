import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('=== API ROUTE: DELETE FILE ===')

    try {
        const body = await request.json()
        const { bucketName, filePath } = body

        console.log('Bucket:', bucketName)
        console.log('Path:', filePath)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        console.log('Supabase URL:', supabaseUrl ? 'EXISTS' : 'MISSING')
        console.log('Service Key:', supabaseServiceKey ? 'EXISTS' : 'MISSING')

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Missing credentials')
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        console.log('Calling supabase.storage.from().remove()...')
        const { data, error } = await supabase.storage
            .from(bucketName)
            .remove([filePath])

        console.log('Supabase Response:')
        console.log('  - Data:', JSON.stringify(data))
        console.log('  - Error:', error ? JSON.stringify(error) : 'null')

        if (error) {
            console.error('❌ Supabase error:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No data returned')
            return NextResponse.json(
                { success: false, error: 'File tidak ditemukan' },
                { status: 404 }
            )
        }

        console.log('✅ Delete successful')
        return NextResponse.json({ success: true, data })

    } catch (err: any) {
        console.error('❌ Exception:', err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
