# Sistem Manajemen Data Irigasi

Dokumentasi lengkap untuk Sistem Manajemen Data Irigasi WebGIS Deli Serdang.

## Fitur Utama

### 1. Pemotongan Saluran Otomatis (Hulu ke Hilir)
Sistem secara otomatis memotong saluran menjadi ruas-ruas berdasarkan posisi bangunan:
- Bangunan diurutkan dari hulu (upstream) ke hilir (downstream)
- Setiap ruas dibuat antara dua bangunan berurutan
- Ruas dinomori secara otomatis: Ruas - 1, Ruas - 2, Ruas - 3, dst

### 2. Sistem Penomoran Otomatis
- **No. Saluran**: Format SAL001, SAL002, dll. Reset untuk setiap Daerah Irigasi
- **No. Ruas**: Format "Ruas - 1", "Ruas - 2", dll. Reset untuk setiap Saluran
- Penomoran konsisten dan terstruktur untuk semua data

### 3. Import Data dari GeoJSON
- Import data bangunan, saluran, dan fungsional
- Format file: GeoJSON standar
- Proses otomatis dengan validasi

### 4. Statistik Otomatis
- Total luas daerah irigasi
- Jumlah saluran per daerah irigasi
- Jumlah bangunan per daerah irigasi
- Panjang total saluran (primer dan sekunder)

## Struktur Database

### Tabel Utama

#### 1. daerah_irigasi
Menyimpan informasi umum daerah irigasi:
- `k_di`: Kode daerah irigasi (unique)
- `n_di`: Nama daerah irigasi
- `luas_ha`: Luas dalam hektar
- `kecamatan`, `desa_kel`: Lokasi
- `sumber_air`: Sumber air irigasi
- `jumlah_saluran`: Total saluran
- `jumlah_bangunan`: Total bangunan

#### 2. saluran
Menyimpan data saluran irigasi:
- `no_saluran`: Nomor saluran (SAL001, SAL002, ...)
- `nama`: Nama saluran
- `jenis`: Tipe saluran (primer/sekunder/tersier)
- `panjang_total`: Panjang total saluran
- `urutan`: Urutan dari hulu ke hilir
- `geojson`: Data geometri

#### 3. ruas
Menyimpan segmen saluran (hasil pemotongan otomatis):
- `no_ruas`: Nomor ruas (Ruas - 1, Ruas - 2, ...)
- `urutan`: Urutan dari hulu ke hilir
- `panjang`: Panjang ruas dalam meter
- `bangunan_awal_id`: Bangunan di awal ruas
- `bangunan_akhir_id`: Bangunan di akhir ruas
- `geojson`: Data geometri

#### 4. bangunan
Menyimpan data bangunan irigasi:
- `nama`: Nama bangunan
- `nomenklatur`: Nomenklatur bangunan
- `tipe`: Tipe bangunan (bendung, bagi, sadap, dll)
- `latitude`, `longitude`: Koordinat
- `urutan_di_saluran`: Urutan di saluran (dari hulu)
- `foto_path`: Path ke foto bangunan

#### 5. fungsional
Menyimpan data fungsional/polygon daerah irigasi:
- Data polygon untuk visualisasi di peta
- Informasi statistik tambahan

## Cara Menggunakan

### 1. Akses Halaman Manajemen Irigasi
1. Login ke aplikasi
2. Di dashboard, klik menu "Manajemen Irigasi"
3. Anda akan melihat halaman dengan tabs: Overview, Import Data, Saluran, Ruas, Bangunan

### 2. Import Data GeoJSON

#### Persiapan File
Siapkan 3 file GeoJSON untuk setiap daerah irigasi:
- `{Nama_DI}_Bangunan.json` - Data point bangunan
- `{Nama_DI}_Saluran.json` - Data linestring saluran
- `{Nama_DI}_Fungsional.json` - Data polygon area irigasi

#### Langkah Import
1. Klik tab "Import Data"
2. Masukkan Kode Daerah Irigasi (contoh: 12120008)
3. Pilih file Bangunan JSON
4. Pilih file Saluran JSON
5. Pilih file Fungsional JSON
6. Klik tombol "Import Data"

#### Proses Otomatis
Sistem akan otomatis:
- Membuat atau update daerah irigasi
- Import semua bangunan
- Import semua saluran
- Mengurutkan bangunan dari hulu ke hilir pada setiap saluran
- Membuat ruas otomatis antara bangunan
- Memberikan nomor otomatis (SAL001, Ruas - 1, dll)
- Menghitung statistik

### 3. Melihat Data

#### Overview
- Lihat daftar semua daerah irigasi
- Statistik per daerah irigasi
- Aksi: View detail, Delete

#### Saluran
- Filter berdasarkan daerah irigasi
- Lihat detail: nomor, nama, jenis, panjang
- Penomoran otomatis: SAL001, SAL002, ...

#### Ruas
- Pilih saluran untuk melihat ruas-ruasnya
- Detail: nomor ruas, bangunan awal/akhir, panjang
- Urutan dari hulu ke hilir
- Penomoran otomatis: Ruas - 1, Ruas - 2, ...

#### Bangunan
- Filter berdasarkan daerah irigasi
- Lihat detail: nama, tipe, lokasi, saluran
- Urutan pada saluran

## Format Data GeoJSON

### Bangunan (Point Features)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude, elevation]
      },
      "properties": {
        "id_di": "...",
        "k_di": "12120008",
        "n_di": "Nama DI",
        "nama": "Nama Bangunan",
        "nomenklatu": "BPB. 1",
        "k_aset": "P01",
        "n_aset": "Bagi",
        "norec": "3",
        "norec_salu": "2",
        "saluran": "Saluran Sekunder 1"
      }
    }
  ]
}
```

### Saluran (LineString Features)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[lon1, lat1], [lon2, lat2], ...]
      },
      "properties": {
        "k_di": "12120008",
        "n_di": "Nama DI",
        "nama": "Saluran Primer",
        "nomenklatu": "RP. 2",
        "k_aset": "S01",
        "n_aset": "Saluran Primer",
        "panjang_sa": "973.17",
        "luas_layan": "136"
      }
    }
  ]
}
```

### Fungsional (Polygon Features)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[lon1, lat1], [lon2, lat2], ...]]]
      },
      "properties": {
        "NAMA_DI": "PAYA BAKUNG I",
        "LUAS_HA": 99.58,
        "Thn_Dat": "2012",
        "Kondisi": "AKTIF",
        "Kecamatan": "HAMPARAN PERAK",
        "Desa_Kel": "PAYA BAKUNG",
        "Smb_Air": "SEI DISKI",
        "PANJANG_SP": 0,
        "PANJANG_SS": 0
      }
    }
  ]
}
```

## Logika Pemotongan Saluran

### Algoritma
1. **Identifikasi Bangunan**: Sistem mengidentifikasi semua bangunan yang terkait dengan saluran berdasarkan field `saluran` di properties
2. **Pengurutan Bangunan**: Bangunan diurutkan menggunakan `norec_salu` (nomor urut di saluran) dari hulu ke hilir
3. **Pembuatan Ruas**:
   - Ruas dibuat antara setiap pasangan bangunan berurutan
   - Ruas pertama: dari bangunan 1 ke bangunan 2
   - Ruas kedua: dari bangunan 2 ke bangunan 3
   - Dan seterusnya...
4. **Penomoran**: Ruas diberi nomor otomatis: "Ruas - 1", "Ruas - 2", dst
5. **Perhitungan Panjang**: Panjang ruas dihitung berdasarkan jarak antar koordinat bangunan

### Contoh
Saluran "Saluran Sekunder 1" memiliki 3 bangunan:
- Bangunan A (norec_salu: 1) - Hulu
- Bangunan B (norec_salu: 2) - Tengah
- Bangunan C (norec_salu: 3) - Hilir

Hasil:
- **Ruas - 1**: Dari Bangunan A ke Bangunan B
- **Ruas - 2**: Dari Bangunan B ke Bangunan C

## Tips dan Best Practices

### 1. Konsistensi Data
- Pastikan field `saluran` di bangunan sama persis dengan `nama` di saluran
- Gunakan `norec_salu` yang konsisten untuk urutan bangunan

### 2. Kualitas Data
- Pastikan koordinat akurat
- Gunakan nomenklatur yang standar
- Lengkapi semua field yang diperlukan

### 3. Import Bertahap
- Import satu daerah irigasi pada satu waktu
- Verifikasi hasil import sebelum lanjut ke daerah irigasi berikutnya

### 4. Backup Data
- Export data GeoJSON original sebagai backup
- Sistem menyimpan data dalam format yang dapat di-export kembali

## Troubleshooting

### Import Gagal
- Periksa format GeoJSON valid
- Pastikan kode DI tidak duplikat
- Cek koneksi ke database

### Ruas Tidak Terbuat
- Periksa field `saluran` di bangunan cocok dengan nama saluran
- Pastikan `norec_salu` terisi dan berurutan

### Penomoran Tidak Urut
- Sistem menggunakan `norec_salu` untuk mengurutkan
- Jika tidak ada `norec_salu`, bangunan akan diurutkan berdasarkan `norec`

## Support
Untuk pertanyaan atau masalah, hubungi tim pengembang WebGIS Deli Serdang.
