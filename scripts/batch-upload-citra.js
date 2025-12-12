/**
 * Script untuk batch upload gambar citra ke Supabase Storage
 * Otomatis mendeteksi DI dari nama file
 * 
 * Cara penggunaan:
 * node scripts/batch-upload-citra.js <folder-path>
 * 
 * Contoh:
 * node scripts/batch-upload-citra.js "D:\2025\EPAKSI Deli Serdang\WEBGIS\FOTO SALURAN - WEBP\CITRA"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase credentials tidak ditemukan di .env.local');
    console.error('Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diset');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
};

// Cache untuk mapping nama DI ke kode DI
let diCache = null;

async function loadAllDI() {
    if (diCache) return diCache;

    console.log('📥 Loading daftar DI dari database...');

    const { data, error } = await supabase
        .from('daerah_irigasi')
        .select('k_di, n_di')
        .order('k_di');

    if (error) {
        throw new Error(`Error loading DI: ${error.message}`);
    }

    diCache = data;
    console.log(`✅ Loaded ${data.length} DI dari database\n`);
    return data;
}

function extractDINameFromFilename(filename) {
    // Hapus extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Split by underscore atau dash
    const parts = nameWithoutExt.split(/[_-]/);

    // Ambil bagian yang kemungkinan nama DI (biasanya di awal atau tengah)
    // Contoh: "Sei_Mencirim_1.webp" -> "Sei Mencirim"
    // Contoh: "D.I.001_Sei_Bingei_2.webp" -> "Sei Bingei"

    // Filter out angka dan kode DI
    const filtered = parts.filter(p => {
        return !p.match(/^[0-9]+$/) && !p.match(/^D\.I\./i);
    });

    return filtered.join(' ').trim();
}

function findBestMatchDI(filename, allDI) {
    const extractedName = extractDINameFromFilename(filename);

    // Coba exact match dulu
    for (const di of allDI) {
        if (di.n_di.toLowerCase() === extractedName.toLowerCase()) {
            return { di, confidence: 'exact' };
        }
    }

    // Coba partial match
    for (const di of allDI) {
        const diNameLower = di.n_di.toLowerCase();
        const extractedLower = extractedName.toLowerCase();

        if (diNameLower.includes(extractedLower) || extractedLower.includes(diNameLower)) {
            return { di, confidence: 'partial' };
        }
    }

    // Coba match per kata
    const extractedWords = extractedName.toLowerCase().split(' ');
    for (const di of allDI) {
        const diWords = di.n_di.toLowerCase().split(' ');
        const matchCount = extractedWords.filter(w => diWords.includes(w)).length;

        if (matchCount >= 2) {
            return { di, confidence: 'words' };
        }
    }

    return null;
}

async function uploadSingleImage(filePath, kodeDI, fileName) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileExt = path.extname(fileName).toLowerCase();
        const contentType = mimeTypes[fileExt] || 'application/octet-stream';
        const storagePath = `${kodeDI}/citra/${fileName}`;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(storagePath, fileBuffer, {
                contentType: contentType,
                upsert: true
            });

        if (error) {
            throw error;
        }

        return {
            success: true,
            fileName: fileName,
            path: data.path
        };

    } catch (error) {
        return {
            success: false,
            fileName: fileName,
            error: error.message
        };
    }
}

async function batchUploadCitra(folderPath) {
    try {
        // Validasi folder
        if (!fs.existsSync(folderPath)) {
            throw new Error(`Folder tidak ditemukan: ${folderPath}`);
        }

        // Load semua DI dari database
        const allDI = await loadAllDI();

        // Baca semua file
        const files = fs.readdirSync(folderPath);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return allowedExtensions.includes(ext);
        });

        if (imageFiles.length === 0) {
            console.log('⚠️  Tidak ada file gambar ditemukan');
            return;
        }

        console.log(`📁 Ditemukan ${imageFiles.length} file gambar\n`);
        console.log('🔍 Mendeteksi DI dari nama file...\n');

        const results = {
            success: [],
            failed: [],
            skipped: []
        };

        // Proses setiap file
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const filePath = path.join(folderPath, fileName);

            console.log(`[${i + 1}/${imageFiles.length}] ${fileName}`);

            // Deteksi DI dari nama file
            const match = findBestMatchDI(fileName, allDI);

            if (!match) {
                console.log(`   ⚠️  Tidak dapat mendeteksi DI - SKIPPED`);
                results.skipped.push({ fileName, reason: 'Cannot detect DI' });
                console.log('');
                continue;
            }

            const { di, confidence } = match;
            console.log(`   📍 Detected: ${di.n_di} (${di.k_di}) [${confidence}]`);

            // Upload
            const result = await uploadSingleImage(filePath, di.k_di, fileName);

            if (result.success) {
                console.log(`   ✅ Uploaded to: images/${result.path}`);
                results.success.push({ ...result, di: di.n_di, kodeDI: di.k_di });
            } else {
                console.log(`   ❌ Failed: ${result.error}`);
                results.failed.push({ ...result, di: di.n_di, kodeDI: di.k_di });
            }

            console.log('');
        }

        // Summary
        console.log('═'.repeat(60));
        console.log('📊 SUMMARY');
        console.log('═'.repeat(60));
        console.log(`✅ Berhasil: ${results.success.length}`);
        console.log(`❌ Gagal: ${results.failed.length}`);
        console.log(`⚠️  Skipped: ${results.skipped.length}`);
        console.log('');

        if (results.success.length > 0) {
            console.log('✅ File yang berhasil diupload:');
            const grouped = {};
            results.success.forEach(r => {
                if (!grouped[r.di]) grouped[r.di] = [];
                grouped[r.di].push(r.fileName);
            });
            Object.keys(grouped).forEach(di => {
                console.log(`\n   ${di}:`);
                grouped[di].forEach(f => console.log(`     - ${f}`));
            });
            console.log('');
        }

        if (results.failed.length > 0) {
            console.log('❌ File yang gagal diupload:');
            results.failed.forEach(r => {
                console.log(`   - ${r.fileName}: ${r.error}`);
            });
            console.log('');
        }

        if (results.skipped.length > 0) {
            console.log('⚠️  File yang di-skip:');
            results.skipped.forEach(r => {
                console.log(`   - ${r.fileName}: ${r.reason}`);
            });
            console.log('');
        }

        return results;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log('📖 Cara penggunaan:');
    console.log('   node scripts/batch-upload-citra.js <folder-path>');
    console.log('');
    console.log('📝 Contoh:');
    console.log('   node scripts/batch-upload-citra.js "D:\\2025\\EPAKSI Deli Serdang\\WEBGIS\\FOTO SALURAN - WEBP\\CITRA"');
    console.log('');
    console.log('📌 Script akan otomatis:');
    console.log('   - Mendeteksi DI dari nama file');
    console.log('   - Upload ke bucket images/[k_di]/citra/');
    console.log('   - Replace file yang sudah ada');
    process.exit(1);
}

const [folderPath] = args;

batchUploadCitra(folderPath)
    .then(results => {
        if (results && results.failed.length === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
