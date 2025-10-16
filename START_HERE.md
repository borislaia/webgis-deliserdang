# 🚀 Panduan Mulai Cepat - WebGIS Deli Serdang

## ⚠️ PENTING: Cara Menjalankan Aplikasi

**Jangan buka file HTML langsung!** File GeoJSON tidak akan muncul karena CORS policy browser.

### ✅ Cara Yang Benar:

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Jalankan Server
```bash
# Dari folder backend
npm run dev

# ATAU dari root directory
npm run backend
```

#### 3. Buka di Browser
```
http://localhost:3000/map.html
```

## 🗺️ Melihat Peta dengan Data GeoJSON

1. **Pastikan server berjalan** - Lihat pesan: `🚀 Server berjalan di http://localhost:3000`

2. **Buka browser** dan navigasi ke:
   - Peta: `http://localhost:3000/map.html`
   - Home: `http://localhost:3000/`
   - Login: `http://localhost:3000/login.html`

3. **Cek Developer Console** (tekan F12):
   - Harus melihat: `✅ Kecamatan layer loaded successfully!`
   - Jika ada error, lihat [TROUBLESHOOTING_GEOJSON.md](TROUBLESHOOTING_GEOJSON.md)

4. **Pastikan layer aktif**:
   - Cek checkbox "Kecamatan Boundaries" di panel kiri
   - Pastikan sudah dicentang ✓

5. **Zoom/Pan peta** jika perlu:
   - Gunakan tombol +/- di kanan bawah
   - Atau scroll mouse untuk zoom
   - Drag untuk pan

## 🎨 Apa yang Seharusnya Terlihat

- **Basemap**: Google Satellite Hybrid (default)
- **Layer Kecamatan**: Polygon berwarna dengan border hitam
- **Popup**: Klik pada polygon untuk melihat nama kecamatan
- **Panel Layer**: Di kiri atas untuk toggle layer dan ganti basemap

## 🔍 Debug Console Messages

Buka Console (F12), Anda harus melihat:

```
Loading batas_kecamatan.json...
Data loaded: {type: "FeatureCollection", features: Array(2)}
Processing GeoJSON with 2 features
Features created: 2
Features extent: [10998489.xxx, 394817.xxx, 11008304.xxx, 407032.xxx]
✅ Kecamatan layer loaded successfully!
```

## ❌ Troubleshooting

### GeoJSON Tidak Muncul?

**Cek ini:**

1. ✅ Server backend berjalan?
   ```bash
   # Harus ada output:
   🚀 Server berjalan di http://localhost:3000
   ```

2. ✅ File dibuka via `http://localhost:3000` bukan `file://`?

3. ✅ Browser console tidak ada error CORS?

4. ✅ Checkbox "Kecamatan Boundaries" dicentang?

5. ✅ Sudah zoom out untuk melihat area yang lebih luas?

**Lihat panduan lengkap:** [TROUBLESHOOTING_GEOJSON.md](TROUBLESHOOTING_GEOJSON.md)

### Port 3000 Sudah Digunakan?

Edit file `backend/.env`:
```env
PORT=3001
```

Lalu akses: `http://localhost:3001/map.html`

## 📂 Struktur File Penting

```
webgis-deliserdang/
├── data/
│   └── batas_kecamatan.json    ← File GeoJSON
├── js/
│   └── map.js                  ← Logic peta (sudah diperbaiki)
├── backend/
│   ├── server.js               ← Server Express
│   └── package.json
├── map.html                    ← Halaman peta
├── START_HERE.md              ← File ini
└── TROUBLESHOOTING_GEOJSON.md ← Panduan debug
```

## 🎯 Quick Commands

```bash
# Install dependencies
cd backend && npm install

# Jalankan server (development)
npm run dev

# Jalankan server (production)
npm start

# Jalankan dari root
npm run backend
```

## 📝 Catatan

- File GeoJSON berisi data batas kecamatan Deli Serdang
- Format: `EPSG:4326` (WGS84)
- Center: `[98.8664, 3.5507]` (Longitude, Latitude)
- Jumlah features: 2 kecamatan (Biru-Biru, Tanjungmorawa)

## ✨ Fitur yang Sudah Diperbaiki

- ✅ Improved error handling untuk loading GeoJSON
- ✅ Console logging untuk debugging
- ✅ Server backend dengan CORS enabled
- ✅ Proper Content-Type headers untuk JSON files
- ✅ Extent calculation untuk features

---

**Selamat menggunakan WebGIS Deli Serdang!** 🗺️

Jika masih ada masalah, cek file [TROUBLESHOOTING_GEOJSON.md](TROUBLESHOOTING_GEOJSON.md)
