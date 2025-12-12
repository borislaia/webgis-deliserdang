/**
 * Script untuk upload gambar ke Supabase Storage
 * Bucket: images/[k_di]/citra/
 * 
 * Cara penggunaan:
 * node scripts/upload-image.js <path-ke-file> <kode-di>
 * 
 * Contoh:
 * node scripts/upload-image.js ./foto.jpg D.I.001
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials tidak ditemukan di .env.local');
    console.error('Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImage(filePath, kodeDI) {
    try {
        // Validasi file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File tidak ditemukan: ${filePath}`);
        }

        // Validasi kode DI
        if (!kodeDI) {
            throw new Error('Kode DI harus diisi');
        }

        // Baca file
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const fileExt = path.extname(fileName).toLowerCase();

        // Validasi tipe file (hanya gambar)
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        if (!allowedExtensions.includes(fileExt)) {
            throw new Error(`Tipe file tidak didukung. Hanya: ${allowedExtensions.join(', ')}`);
        }

        // Tentukan MIME type
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        const contentType = mimeTypes[fileExt] || 'application/octet-stream';

        // Path di bucket: images/[k_di]/citra/[filename]
        const storagePath = `${kodeDI}/citra/${fileName}`;

        console.log('📤 Uploading file...');
        console.log(`   File: ${fileName}`);
        console.log(`   Kode DI: ${kodeDI}`);
        console.log(`   Path: images/${storagePath}`);
        console.log(`   Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

        // Upload ke Supabase Storage
        const { data, error } = await supabase.storage
            .from('images')
            .upload(storagePath, fileBuffer, {
                contentType: contentType,
                upsert: true // Replace file jika sudah ada
            });

        if (error) {
            throw error;
        }

        console.log('✅ Upload berhasil!');
        console.log(`   Storage path: ${data.path}`);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath);

        console.log(`   Public URL: ${urlData.publicUrl}`);

        return {
            success: true,
            path: data.path,
            publicUrl: urlData.publicUrl
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('📖 Cara penggunaan:');
    console.log('   node scripts/upload-image.js <path-ke-file> <kode-di>');
    console.log('');
    console.log('📝 Contoh:');
    console.log('   node scripts/upload-image.js ./foto.jpg D.I.001');
    console.log('   node scripts/upload-image.js C:\\Users\\asus\\Pictures\\foto.png D.I.002');
    process.exit(1);
}

const [filePath, kodeDI] = args;

uploadImage(filePath, kodeDI)
    .then(result => {
        process.exit(result.success ? 0 : 1);
    });
