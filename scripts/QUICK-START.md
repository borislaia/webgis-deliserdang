# 🚀 Quick Start - Upload Gambar

## ⭐ Upload by Nama DI (Recommended)

### Upload 1 File
```bash
node scripts/upload-image-by-name.js <path-file> "nama-di"
```

**Contoh:**
```bash
node scripts/upload-image-by-name.js C:\Users\asus\Pictures\foto.jpg "Sei Mencirim"
```

### Upload Banyak File
```bash
node scripts/upload-multiple-images-by-name.js <folder-path> "nama-di"
```

**Contoh:**
```bash
node scripts/upload-multiple-images-by-name.js C:\Users\asus\Pictures\galeri "Sei Mencirim"
```

---

## Upload by Kode DI

### Upload 1 File
```bash
node scripts/upload-image.js <path-file> <kode-di>
```

**Contoh:**
```bash
node scripts/upload-image.js C:\Users\asus\Pictures\foto.jpg D.I.001
```

### Upload Banyak File
```bash
node scripts/upload-multiple-images.js <folder-path> <kode-di>
```

**Contoh:**
```bash
node scripts/upload-multiple-images.js C:\Users\asus\Pictures\galeri D.I.001
```

---

## ⚡ Fitur
- ✅ Otomatis replace file yang sudah ada
- ✅ Support: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- ✅ Tampilkan Public URL setelah upload
- ✅ Progress indicator untuk multiple upload

## 📍 Lokasi Upload
```
images/[kode-di]/citra/[nama-file]
```

**Contoh:** `images/D.I.001/citra/foto.jpg`

---

📖 **Dokumentasi lengkap:** [README-UPLOAD.md](./README-UPLOAD.md)
