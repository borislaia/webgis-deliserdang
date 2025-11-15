import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Manifest shape untuk GeoJSON files
 */
interface GeoJSONManifest {
  updatedAt: string
  total: number
  files: string[]
}

/**
 * GET /api/geojson/manifest
 * 
 * Mengambil manifest (daftar) semua file GeoJSON yang tersedia di storage.
 * Manifest ini digunakan untuk mengetahui file-file GeoJSON yang dapat di-load.
 * 
 * @param _req - Request object (tidak digunakan)
 * @returns JSON response dengan manifest: { updatedAt: string, total: number, files: string[] }
 * @throws 500 Internal Server Error jika environment variables tidak dikonfigurasi atau terjadi kesalahan
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/geojson/manifest')
 * const manifest = await response.json()
 * // { updatedAt: '2024-01-01T00:00:00.000Z', total: 10, files: ['file1.json', 'file2.json'] }
 * ```
 */
export async function GET(_req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE env vars' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Recursively list all .json/.geojson under bucket geojson
    const listAll = async (prefix: string): Promise<string[]> => {
      const { data, error } = await supabase.storage.from('geojson').list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
      if (error) throw error
      const results: string[] = []
      for (const item of data || []) {
        const name = item.name || ''
        const fullPath = prefix ? `${prefix}${name}` : name
        // Heuristic: no dot => folder, recurse
        if (/\.[a-z0-9]+$/i.test(name)) {
          const lower = name.toLowerCase()
          if (lower.endsWith('.json') || lower.endsWith('.geojson')) results.push(fullPath)
        } else {
          const nested = await listAll(`${fullPath}/`)
          results.push(...nested)
        }
      }
      return results
    }

    const files = await listAll('')
    const manifest = {
      updatedAt: new Date().toISOString(),
      total: files.length,
      files,
    }

    // Upload manifest back to storage for CDN delivery
    try {
      const body = Buffer.from(JSON.stringify(manifest))
      await supabase.storage
        .from('geojson')
        .upload('manifest.json', body, { upsert: true, cacheControl: '3600', contentType: 'application/json' })
    } catch (e) {
      // Non-fatal: still return manifest
      // Log error but don't expose to client
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to upload manifest.json:', e)
      }
    }

    return NextResponse.json(manifest)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
