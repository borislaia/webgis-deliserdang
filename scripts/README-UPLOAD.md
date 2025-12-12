# 📤 Upload Gambar ke Supabase Storage

Script untuk upload gambar dari komputer lokal ke Supabase Storage bucket `images/[k_di]/citra/`.

## 📋 Prasyarat

1. File `.env.local` sudah dikonfigurasi dengan:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Dependencies sudah terinstall:
   ```bash
   npm install
   ```

## 🚀 Cara Penggunaan

### 1. Upload Single File (by Kode DI)

Upload satu file gambar menggunakan **kode DI**:

```bash
node scripts/upload-image.js <path-ke-file> <kode-di>
```

**Contoh:**
```bash
# Windows
node scripts/upload-image.js C:\Users\asus\Pictures\foto.jpg D.I.001

# Relative path
node scripts/upload-image.js ./foto.png D.I.002
```

### 2. Upload Multiple Files (by Kode DI)

Upload semua gambar dari satu folder menggunakan **kode DI**:

```bash
node scripts/upload-multiple-images.js <folder-path> <kode-di>
```

**Contoh:**
```bash
# Windows
node scripts/upload-multiple-images.js C:\Users\asus\Pictures\galeri D.I.001

# Relative path
node scripts/upload-multiple-images.js ./photos D.I.002
```

---

### 3. Upload Single File (by Nama DI) ⭐ NEW!

Upload satu file gambar menggunakan **nama DI** (otomatis mencari kode DI):

```bash
node scripts/upload-image-by-name.js <path-ke-file> "nama-di"
```

**Contoh:**
```bash
node scripts/upload-image-by-name.js ./foto.jpg "Sei Mencirim"
node scripts/upload-image-by-name.js C:\Users\asus\Pictures\foto.png "Sei Bingei"
```

### 4. Upload Multiple Files (by Nama DI) ⭐ NEW!

Upload semua gambar dari satu folder menggunakan **nama DI**:

```bash
node scripts/upload-multiple-images-by-name.js <folder-path> "nama-di"
```

**Contoh:**
```bash
node scripts/upload-multiple-images-by-name.js ./photos "Sei Mencirim"
node scripts/upload-multiple-images-by-name.js C:\Users\asus\Pictures "Sei Bingei"
```

**💡 Tips untuk Upload by Name:**
- Gunakan tanda kutip `"..."` untuk nama DI yang mengandung spasi
- Nama DI tidak perlu lengkap, cukup sebagian yang unik (contoh: "Mencirim" untuk "Sei Mencirim")
- Jika ditemukan lebih dari 1 DI yang cocok, script akan menampilkan pilihan

## 📁 Struktur Upload

File akan diupload ke struktur berikut:
```
images/
  └── [kode-di]/
      └── citra/
          ├── foto1.jpg
          ├── foto2.png
          └── foto3.webp
```

**Contoh:**
- Kode DI: `D.I.001`
- File: `foto.jpg`
- Path di bucket: `images/D.I.001/citra/foto.jpg`

## 🖼️ Format Gambar yang Didukung

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

## ✅ Output

Script akan menampilkan:
- ✅ Status upload (berhasil/gagal)
- 📊 Informasi file (nama, ukuran, path)
- 🔗 Public URL untuk mengakses gambar

**Contoh output:**
```
📤 Uploading file...
   File: foto.jpg
   Kode DI: D.I.001
   Path: images/D.I.001/citra/foto.jpg
   Size: 245.67 KB
✅ Upload berhasil!
   Storage path: D.I.001/citra/foto.jpg
   Public URL: https://xxx.supabase.co/storage/v1/object/public/images/D.I.001/citra/foto.jpg
```

## ⚠️ Catatan Penting

1. **Overwrite**: Script akan **otomatis replace** file yang sudah ada dengan nama yang sama. Jika Anda tidak ingin overwrite, rename file terlebih dahulu atau ubah `upsert: true` menjadi `upsert: false` di dalam script.

2. **Permissions**: Pastikan bucket `images` sudah memiliki policy yang tepat di Supabase Storage.

3. **File Size**: Perhatikan limit ukuran file di Supabase (default: 50MB per file).

4. **Kode DI**: Pastikan kode DI yang digunakan sudah ada di database `daerah_irigasi`.

## 🔧 Troubleshooting

### Error: "Supabase credentials tidak ditemukan"
- Pastikan file `.env.local` ada dan berisi credentials yang benar

### Error: "File tidak ditemukan"
- Periksa path file yang Anda masukkan
- Gunakan absolute path atau pastikan relative path benar

### Error: "New row violates row-level security policy"
- Periksa RLS policies di Supabase Storage
- Pastikan user memiliki permission untuk upload

## 📚 Referensi

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/storage-from-upload)
