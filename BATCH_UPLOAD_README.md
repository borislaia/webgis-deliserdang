# Panduan Upload Batch File untuk data/public

## 📋 Deskripsi
Script ini membantu mengupload file batch ke setiap folder di `data/public`. Ada dua metode yang tersedia:

1. **Python Script** - Membuat file template baru
2. **Shell Script** - Menyalin file dari folder template yang sudah ada

## 🚀 Cara Penggunaan

### Metode 1: Python Script (Recommended)
```bash
# Jalankan script Python
python3 upload_batch_files.py
```

**Keunggulan:**
- Membuat file template yang konsisten
- Menyesuaikan nama file dengan folder
- Lebih fleksibel dan dapat dikustomisasi

### Metode 2: Shell Script
```bash
# Berikan permission execute
chmod +x upload_batch.sh

# Jalankan script
./upload_batch.sh
```

**Keunggulan:**
- Lebih cepat
- Menggunakan file template yang sudah ada
- Tidak memerlukan Python

## 📁 Struktur File yang Dibuat

Setiap folder akan memiliki 3 file JSON:

1. **`{folder_name}_Bangunan.json`** - Data bangunan (Point features)
2. **`{folder_name}_Fungsional.json`** - Data fungsional (Polygon features)  
3. **`{folder_name}_Saluran.json`** - Data saluran (LineString features)

## 📊 Folder yang Akan Diproses

Berdasarkan struktur saat ini, script akan memproses folder:
- 12120005
- 12120008 (sudah memiliki file)
- 12120009 (sudah memiliki file)
- 12120010
- 12120011
- 12120031
- 12120032
- 12120051
- 12120052
- 12120058
- 12120063
- 12120066
- 12120077
- 12120078
- 12120087

## ⚙️ Konfigurasi

### Python Script
Anda dapat mengubah template data di fungsi:
- `create_template_bangunan()`
- `create_template_fungsional()`
- `create_template_saluran()`

### Shell Script
Ubah `TEMPLATE_FOLDER` di script untuk menggunakan folder template yang berbeda:
```bash
TEMPLATE_FOLDER="12120009"  # Ganti dengan folder template yang diinginkan
```

## 🔍 Verifikasi Hasil

Setelah menjalankan script, periksa hasilnya:

```bash
# Lihat semua file JSON di setiap folder
find data/public -name "*.json" | sort

# Hitung jumlah file per folder
for folder in data/public/*/; do
    echo "$(basename "$folder"): $(ls "$folder"*.json 2>/dev/null | wc -l) files"
done
```

## 🛠️ Troubleshooting

### Error: Permission denied
```bash
chmod +x upload_batch.sh
```

### Error: Python not found
```bash
# Install Python 3 jika belum ada
sudo apt update
sudo apt install python3
```

### Error: Folder tidak ditemukan
Pastikan Anda menjalankan script dari direktori root project (dimana ada folder `data/public`)

## 📝 Catatan

- Script akan melewati folder yang sudah memiliki file JSON
- File template dibuat dengan data dummy yang dapat disesuaikan
- Semua file menggunakan encoding UTF-8
- Format JSON mengikuti GeoJSON standard

## 🎯 Langkah Selanjutnya

Setelah file template dibuat, Anda dapat:
1. Mengganti data dummy dengan data asli
2. Menyesuaikan koordinat geografis
3. Mengupdate properti sesuai kebutuhan
4. Mengintegrasikan dengan sistem upload yang ada