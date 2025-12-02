# Panduan Recovery Supabase Setelah Pause

## ⚠️ Apa yang Terjadi?

Ketika project Supabase di-pause karena tidak aktif selama 7 hari (pada tier gratis), Supabase akan:
1. **Menghentikan database** - Database di-suspend dan bisa di-reset
2. **Menghapus storage buckets** - Semua bucket storage dihapus
3. **Menghapus data** - Semua data di database dan storage hilang

**Ini adalah perilaku normal untuk Supabase Free Tier** - mereka tidak menjamin persistensi data untuk project yang di-pause.

## ✅ Solusi: Restore Database & Storage

### Langkah 1: Restore Database Schema

Anda perlu menjalankan semua migrasi database yang ada untuk membuat kembali struktur tabel.

#### Opsi A: Menggunakan Supabase Dashboard (Recommended)

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka **SQL Editor**
4. Jalankan migrasi satu per satu sesuai urutan:

**Urutan migrasi yang harus dijalankan:**
1. `20251027130307_create_irrigation_management_system.sql` - Membuat semua tabel dasar
2. `20251029120000_update_policies_and_schema.sql` - Update policies dan audit log
3. `20251103100000_enable_roles.sql` - Setup role system
4. `20251104120000_fix_admin_email.sql` - Fix admin email
5. `20251104121500_storage_policies.sql` - Setup storage policies
6. `20251114103000_add_missing_daerah_irigasi_id.sql` - Fix daerah_irigasi id
7. `20251114104500_add_kode_irigasi_alias.sql` - Add kode_irigasi alias

**Cara menjalankan:**
- Copy isi setiap file migrasi
- Paste ke SQL Editor
- Klik "Run" atau tekan Ctrl+Enter
- Tunggu sampai selesai sebelum lanjut ke migrasi berikutnya

#### Opsi B: Menggunakan Supabase CLI (Jika terinstall)

```bash
# Install Supabase CLI jika belum ada
npm install -g supabase

# Login ke Supabase
supabase login

# Link ke project Anda
supabase link --project-ref your-project-ref

# Jalankan semua migrasi
supabase db push
```

### Langkah 2: Buat Storage Buckets Kembali

Setelah migrasi database selesai, buat bucket storage yang diperlukan:

1. Buka **Storage** di Supabase Dashboard
2. Klik **New bucket**
3. Buat bucket berikut:

#### Bucket: `geojson`
- **Name:** `geojson`
- **Public bucket:** ✅ Yes (untuk akses public)
- **File size limit:** Sesuaikan kebutuhan (misal: 50 MB)
- **Allowed MIME types:** `application/json`, `application/geo+json`

#### Bucket: `images`
- **Name:** `images`
- **Public bucket:** ✅ Yes
- **File size limit:** Sesuaikan kebutuhan (misal: 10 MB)
- **Allowed MIME types:** `image/*`

#### Bucket: `csv` (jika diperlukan)
- **Name:** `csv`
- **Public bucket:** ✅ Yes
- **File size limit:** Sesuaikan kebutuhan
- **Allowed MIME types:** `text/csv`, `application/vnd.ms-excel`

**Catatan:** Storage policies sudah dibuat oleh migrasi `20251104121500_storage_policies.sql`, jadi setelah bucket dibuat, policies akan otomatis berlaku.

### Langkah 3: Setup Admin User

Setelah database restore, setup admin user:

1. Buka **Authentication** → **Users** di Supabase Dashboard
2. Cari atau buat user dengan email `borizzzlaia@gmail.com`
3. Jika user sudah ada, jalankan SQL ini untuk set sebagai admin:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb), 
  '{role}', 
  to_jsonb('admin'::text), 
  true
),
raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  to_jsonb('admin'::text), 
  true
)
WHERE email = 'borizzzlaia@gmail.com';
```

### Langkah 4: Restore Data (Jika Ada Backup)

Jika Anda memiliki backup data:

#### Restore Database Data:
1. Jika ada backup SQL, jalankan di SQL Editor
2. Jika ada export CSV, gunakan **Table Editor** → **Import data**

#### Restore Storage Files:
1. Upload file GeoJSON ke bucket `geojson`
2. Upload gambar ke bucket `images` sesuai struktur folder yang ada
3. Struktur folder yang diperlukan:
   - `geojson/{k_di}/` - File GeoJSON per daerah irigasi
   - `images/{k_di}/{folder_name}/` - Foto-foto per daerah irigasi

## 🔍 Verifikasi Setup

Setelah semua langkah selesai, verifikasi:

### 1. Cek Tabel Database
Jalankan di SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Harus ada tabel:
- `daerah_irigasi`
- `saluran`
- `ruas`
- `bangunan`
- `fungsional`
- `audit_log`

### 2. Cek Storage Buckets
Di Storage dashboard, pastikan ada:
- `geojson`
- `images`
- `csv` (jika diperlukan)

### 3. Test Koneksi
Jalankan aplikasi lokal:
```bash
npm run dev
```

Coba:
- Login dengan akun admin
- Akses dashboard
- Test upload file (jika admin)

## 📋 Checklist Recovery

- [ ] Semua migrasi database dijalankan
- [ ] Bucket `geojson` dibuat
- [ ] Bucket `images` dibuat
- [ ] Bucket `csv` dibuat (jika diperlukan)
- [ ] Admin user di-setup
- [ ] Storage policies aktif
- [ ] Tabel database terverifikasi
- [ ] Test koneksi aplikasi
- [ ] Data di-restore (jika ada backup)

## 🚨 Pencegahan di Masa Depan

### 1. Upgrade ke Paid Tier
- Paid tier tidak akan pause project
- Data lebih aman dan terjamin

### 2. Backup Rutin
- Export database secara berkala
- Backup storage files ke lokasi lain (S3, Google Drive, dll)
- Setup automated backup jika memungkinkan

### 3. Monitor Project
- Aktifkan email notifications
- Check project secara berkala
- Jangan biarkan project idle terlalu lama

### 4. Gunakan Supabase CLI untuk Migrasi
- Version control untuk schema
- Mudah restore dengan `supabase db push`

## 📝 Catatan Penting

1. **Data yang hilang tidak bisa di-recover** jika tidak ada backup
2. **Storage files harus di-upload ulang** secara manual
3. **Environment variables tetap sama** - tidak perlu diubah
4. **Migrasi harus dijalankan berurutan** sesuai timestamp

## 🆘 Jika Masih Ada Masalah

1. Cek **Logs** di Supabase Dashboard untuk error
2. Pastikan semua migrasi berjalan tanpa error
3. Verifikasi RLS policies aktif
4. Pastikan service role key masih valid
5. Check network connectivity ke Supabase

## 📚 Referensi

- [Supabase Pause Policy](https://supabase.com/docs/guides/platform/pausing)
- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
