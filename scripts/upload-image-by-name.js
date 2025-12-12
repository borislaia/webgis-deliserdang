/**
 * Script untuk upload gambar ke Supabase Storage menggunakan NAMA DI
 * Bucket: images/[k_di]/citra/
 * 
 * Cara penggunaan:
 * node scripts/upload-image-by-name.js <path-ke-file> <nama-di>
 * 
 * Contoh:
 * node scripts/upload-image-by-name.js ./foto.jpg "Sei Mencirim"
 * node scripts/upload-image-by-name.js ./foto.jpg "Sei Bingei"
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

async function findKodeDIByName(namaDI) {
    try {
        console.log(`🔍 Mencari kode DI untuk: "${namaDI}"...`);

        // Query database untuk mencari kode DI berdasarkan nama
        const { data, error } = await supabase
            .from('daerah_irigasi')
            .select('k_di, nama_di')
            .ilike('nama_di', `%${namaDI}%`)
            .limit(10);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error(`Tidak ditemukan DI dengan nama: "${namaDI}"`);
        }

        // Jika ditemukan lebih dari 1, tampilkan pilihan
        if (data.length > 1) {
            console.log(`\n⚠️  Ditemukan ${data.length} DI yang cocok:`);
            data.forEach((di, index) => {
                console.log(`   ${index + 1}. ${di.nama_di} (${di.k_di})`);
            });
            console.log('\n💡 Gunakan nama yang lebih spesifik atau gunakan kode DI langsung.');
            console.log('   Contoh: node scripts/upload-image.js <file> ' + data[0].k_di);
            process.exit(1);
        }

        const result = data[0];
        console.log(`✅ Ditemukan: ${result.nama_di} (${result.k_di})`);
        return result.k_di;

    } catch (error) {
        console.error('❌ Error mencari DI:', error.message);
        throw error;
    }
}

async function uploadImage(filePath, kodeDI) {
    try {
        // Validasi file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File tidak ditemukan: ${filePath}`);
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

        console.log('\n📤 Uploading file...');
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
    console.log('   node scripts/upload-image-by-name.js <path-ke-file> <nama-di>');
    console.log('');
    console.log('📝 Contoh:');
    console.log('   node scripts/upload-image-by-name.js ./foto.jpg "Sei Mencirim"');
    console.log('   node scripts/upload-image-by-name.js C:\\Users\\asus\\Pictures\\foto.png "Sei Bingei"');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Gunakan tanda kutip untuk nama DI yang mengandung spasi');
    console.log('   - Nama DI tidak perlu lengkap, cukup sebagian yang unik');
    process.exit(1);
}

const [filePath, namaDI] = args;

(async () => {
    try {
        // Cari kode DI berdasarkan nama
        const kodeDI = await findKodeDIByName(namaDI);

        // Upload file
        const result = await uploadImage(filePath, kodeDI);

        process.exit(result.success ? 0 : 1);
    } catch (error) {
        process.exit(1);
    }
})();
