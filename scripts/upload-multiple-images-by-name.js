/**
 * Script untuk upload multiple gambar ke Supabase Storage menggunakan NAMA DI
 * Bucket: images/[k_di]/citra/
 * 
 * Cara penggunaan:
 * node scripts/upload-multiple-images-by-name.js <folder-path> <nama-di>
 * 
 * Contoh:
 * node scripts/upload-multiple-images-by-name.js ./photos "Sei Mencirim"
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
};

async function findKodeDIByName(namaDI) {
    try {
        console.log(`🔍 Mencari kode DI untuk: "${namaDI}"...`);

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

        if (data.length > 1) {
            console.log(`\n⚠️  Ditemukan ${data.length} DI yang cocok:`);
            data.forEach((di, index) => {
                console.log(`   ${index + 1}. ${di.nama_di} (${di.k_di})`);
            });
            console.log('\n💡 Gunakan nama yang lebih spesifik atau gunakan kode DI langsung.');
            console.log('   Contoh: node scripts/upload-multiple-images.js <folder> ' + data[0].k_di);
            process.exit(1);
        }

        const result = data[0];
        console.log(`✅ Ditemukan: ${result.nama_di} (${result.k_di})\n`);
        return result.k_di;

    } catch (error) {
        console.error('❌ Error mencari DI:', error.message);
        throw error;
    }
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
                upsert: true // Replace file jika sudah ada
            });

        if (error) {
            throw error;
        }

        const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(storagePath);

        return {
            success: true,
            fileName: fileName,
            path: data.path,
            publicUrl: urlData.publicUrl
        };

    } catch (error) {
        return {
            success: false,
            fileName: fileName,
            error: error.message
        };
    }
}

async function uploadMultipleImages(folderPath, kodeDI) {
    try {
        // Validasi folder exists
        if (!fs.existsSync(folderPath)) {
            throw new Error(`Folder tidak ditemukan: ${folderPath}`);
        }

        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
            throw new Error(`Path bukan folder: ${folderPath}`);
        }

        // Baca semua file di folder
        const files = fs.readdirSync(folderPath);

        // Filter hanya file gambar
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return allowedExtensions.includes(ext);
        });

        if (imageFiles.length === 0) {
            console.log('⚠️  Tidak ada file gambar ditemukan di folder');
            return;
        }

        console.log(`📁 Ditemukan ${imageFiles.length} file gambar`);
        console.log(`📤 Uploading ke: images/${kodeDI}/citra/`);
        console.log('');

        const results = {
            success: [],
            failed: []
        };

        // Upload satu per satu
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const filePath = path.join(folderPath, fileName);

            console.log(`[${i + 1}/${imageFiles.length}] Uploading ${fileName}...`);

            const result = await uploadSingleImage(filePath, kodeDI, fileName);

            if (result.success) {
                console.log(`   ✅ Success`);
                results.success.push(result);
            } else {
                console.log(`   ❌ Failed: ${result.error}`);
                results.failed.push(result);
            }
        }

        // Summary
        console.log('');
        console.log('📊 Summary:');
        console.log(`   ✅ Berhasil: ${results.success.length}`);
        console.log(`   ❌ Gagal: ${results.failed.length}`);

        if (results.success.length > 0) {
            console.log('');
            console.log('✅ File yang berhasil diupload:');
            results.success.forEach(r => {
                console.log(`   - ${r.fileName}`);
            });
        }

        if (results.failed.length > 0) {
            console.log('');
            console.log('❌ File yang gagal diupload:');
            results.failed.forEach(r => {
                console.log(`   - ${r.fileName}: ${r.error}`);
            });
        }

        return results;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('📖 Cara penggunaan:');
    console.log('   node scripts/upload-multiple-images-by-name.js <folder-path> <nama-di>');
    console.log('');
    console.log('📝 Contoh:');
    console.log('   node scripts/upload-multiple-images-by-name.js ./photos "Sei Mencirim"');
    console.log('   node scripts/upload-multiple-images-by-name.js C:\\Users\\asus\\Pictures "Sei Bingei"');
    console.log('');
    console.log('📌 Format gambar yang didukung:');
    console.log('   .jpg, .jpeg, .png, .gif, .webp');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Gunakan tanda kutip untuk nama DI yang mengandung spasi');
    console.log('   - Nama DI tidak perlu lengkap, cukup sebagian yang unik');
    process.exit(1);
}

const [folderPath, namaDI] = args;

(async () => {
    try {
        // Cari kode DI berdasarkan nama
        const kodeDI = await findKodeDIByName(namaDI);

        // Upload files
        const results = await uploadMultipleImages(folderPath, kodeDI);

        if (results && results.failed.length === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (error) {
        process.exit(1);
    }
})();
