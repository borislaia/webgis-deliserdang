# Ringkasan Fitur CRUD di Repository

## Database Schema

Repository ini memiliki 5 tabel utama:
1. **daerah_irigasi** - Data daerah irigasi
2. **saluran** - Data saluran irigasi
3. **ruas** - Data ruas saluran (segmen ~50m)
4. **bangunan** - Data bangunan irigasi
5. **fungsional** - Data fungsional daerah irigasi

Semua tabel memiliki RLS (Row Level Security) enabled dengan policy untuk authenticated users.

---

## Fitur CRUD yang Tersedia

### ✅ CREATE (Buat Data)

#### 1. **Import Data GeoJSON** (Admin Only)
- **Lokasi**: `components/IrrigationManagementView.tsx` → Tab "Import GeoJSON"
- **Endpoint**: Supabase Function `import-irrigation-data`
- **Fitur**:
  - Import data dari file GeoJSON (Bangunan, Saluran, Fungsional)
  - Membuat/update daerah_irigasi berdasarkan kode DI
  - Membuat saluran dengan segmentasi otomatis menjadi ruas ~50m
  - Membuat bangunan dengan koordinat dari GeoJSON
  - Membuat data fungsional
  - Upload file ke storage bucket `geojson`

#### 2. **User Registration**
- **Lokasi**: `app/register/page.tsx` (implied)
- Sistem autentikasi Supabase untuk registrasi user baru

#### 3. **User Management** (Admin Only)
- **Lokasi**: `app/dashboard/page.tsx` → Panel "Users"
- Membuat user baru melalui sistem autentikasi Supabase

---

### ✅ READ (Baca Data)

#### 1. **Dashboard - Daerah Irigasi**
- **Lokasi**: `app/dashboard/page.tsx` → Panel "Daerah Irigasi"
- **Query**: `SELECT` dari tabel `daerah_irigasi`
- Menampilkan: Kode DI, Nama, Luas, Kecamatan, Desa/Kel, Sumber Air, Tahun Data

#### 2. **Manajemen Irigasi - Overview**
- **Lokasi**: `components/IrrigationManagementView.tsx` → Tab "Overview"
- **Query**: `SELECT` dari tabel `daerah_irigasi` (limit 50)

#### 3. **Manajemen Irigasi - Saluran**
- **Lokasi**: `components/IrrigationManagementView.tsx` → Tab "Saluran"
- **Query**: `SELECT` dari tabel `saluran` (limit 100, ordered by urutan)

#### 4. **Manajemen Irigasi - Ruas**
- **Lokasi**: `components/IrrigationManagementView.tsx` → Tab "Ruas"
- **Query**: `SELECT` dari tabel `ruas` (limit 100, ordered by urutan)

#### 5. **Manajemen Irigasi - Bangunan**
- **Lokasi**: `components/IrrigationManagementView.tsx` → Tab "Bangunan"
- **Query**: `SELECT` dari tabel `bangunan` (limit 100, ordered by urutan_di_saluran)

#### 6. **User Management** (Admin Only)
- **Lokasi**: `app/dashboard/page.tsx` → Panel "Users"
- **Endpoint**: `GET /api/admin/users`
- Menampilkan: Email, Role, Created At, Last Sign In

#### 7. **GeoJSON Manifest**
- **Endpoint**: `GET /api/geojson/manifest`
- Membaca daftar file GeoJSON dari storage bucket

#### 8. **Detail Daerah Irigasi**
- **Lokasi**: `app/di/[k_di]/page.tsx`
- Membaca detail daerah irigasi beserta statistik (jumlah saluran, bangunan, ruas)

---

### ✅ UPDATE (Update Data)

#### 1. **Import GeoJSON - Update Existing**
- **Lokasi**: `supabase/functions/import-irrigation-data/index.ts`
- **Action**: `import`
- Jika daerah_irigasi dengan kode DI sudah ada, akan di-update:
  - Update semua field daerah_irigasi
  - Data saluran, ruas, bangunan, fungsional tetap dibuat baru (tidak di-update)

#### 2. **User Role Update** (Admin Only)
- **Lokasi**: `app/dashboard/page.tsx` → Panel "Users"
- **Endpoint**: `PATCH /api/admin/users`
- **Fitur**:
  - Update role user (admin/user)
  - Validasi: Admin tidak bisa mengubah role sendiri
  - Validasi: Admin tidak bisa mengubah role admin lain

#### 3. **Process DI - Re-import**
- **Lokasi**: `supabase/functions/import-irrigation-data/index.ts`
- **Action**: `process_di`
- **Fitur**:
  - Menghapus data DI yang ada
  - Re-import semua data dari storage
  - Update statistik (jumlah_saluran, jumlah_bangunan)

---

### ✅ DELETE (Hapus Data)

#### 1. **Process DI - Delete Before Re-import**
- **Lokasi**: `supabase/functions/import-irrigation-data/index.ts`
- **Action**: `process_di`
- **Query**: `DELETE` dari tabel `daerah_irigasi` (cascade ke tabel terkait)
- Menghapus data DI yang ada sebelum melakukan re-import

#### 2. **Database Policies**
- Semua tabel memiliki policy DELETE untuk authenticated users
- Namun, **TIDAK ADA UI/form untuk delete individual records**

---

## ⚠️ Fitur CRUD yang BELUM Tersedia

### ❌ Tidak Ada UI untuk:
1. **Edit individual record** (daerah_irigasi, saluran, ruas, bangunan, fungsional)
   - Hanya ada tabel read-only
   - Tidak ada form edit untuk mengubah data satu per satu

2. **Delete individual record**
   - Tidak ada tombol delete di tabel
   - Hanya ada delete melalui re-import (process_di)

3. **Create individual record** (selain import bulk)
   - Tidak ada form untuk menambah satu daerah irigasi baru
   - Tidak ada form untuk menambah saluran/ruas/bangunan baru secara manual

4. **Update individual record**
   - Tidak ada form untuk mengedit satu saluran/ruas/bangunan
   - Hanya bisa update melalui re-import seluruh data

---

## Kesimpulan

### Fitur CRUD yang Lengkap:
- ✅ **User Management**: Create, Read, Update (role)
- ✅ **Bulk Import**: Create/Update data irigasi via GeoJSON

### Fitur CRUD yang Terbatas:
- ⚠️ **Data Irigasi**: Hanya Read dan Bulk Import
- ⚠️ **Tidak ada CRUD individual** untuk:
  - daerah_irigasi
  - saluran
  - ruas
  - bangunan
  - fungsional

### Rekomendasi Pengembangan:
1. Tambahkan form untuk create/edit/delete individual records
2. Tambahkan tombol edit/delete di setiap baris tabel
3. Implementasikan API endpoints untuk CRUD individual
4. Tambahkan validasi dan konfirmasi sebelum delete
