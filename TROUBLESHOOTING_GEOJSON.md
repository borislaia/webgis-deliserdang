# Troubleshooting: GeoJSON Tidak Tampil di Peta

## 🔍 Penyebab Umum

### 1. **File Dibuka Langsung di Browser (CORS Error)**

**Masalah:** Browser memblokir loading file JSON karena CORS policy ketika membuka file HTML langsung (`file://`).

**Solusi:** 
```bash
# Jalankan server backend
cd backend
npm install
npm run dev
```

Kemudian buka: `http://localhost:3000/map.html`

### 2. **Path File Salah**

**Periksa:**
- File GeoJSON ada di: `data/batas_kecamatan.json` ✅
- Path di map.js: `./data/batas_kecamatan.json` ✅

### 3. **Format GeoJSON Salah**

**Format yang benar:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": { ... }
    }
  ]
}
```

File Anda: ✅ Format sudah benar

### 4. **Projection/Koordinat Salah**

File GeoJSON Anda menggunakan `EPSG:4326` (WGS84) - ini sudah benar dan sesuai dengan konfigurasi di map.js.

## 🛠️ Cara Debug

### Step 1: Buka Developer Console

1. Buka `http://localhost:3000/map.html` di browser
2. Tekan `F12` atau klik kanan > Inspect
3. Buka tab **Console**

### Step 2: Periksa Log Messages

Anda harus melihat:
```
Loading batas_kecamatan.json...
Data loaded: {type: "FeatureCollection", features: Array(2)}
Processing GeoJSON with 2 features
Features created: 2
Features extent: [...]
✅ Kecamatan layer loaded successfully!
```

### Step 3: Periksa Error

Jika melihat error, cek:

**❌ CORS Error:**
```
Access to fetch at 'file://...' from origin 'null' has been blocked by CORS policy
```
→ Solusi: Jalankan dengan server backend

**❌ 404 Not Found:**
```
GET http://localhost:3000/data/batas_kecamatan.json 404 (Not Found)
```
→ Solusi: Pastikan file ada di folder `data/`

**❌ JSON Parse Error:**
```
Unexpected token < in JSON at position 0
```
→ Solusi: File mungkin berisi HTML error page, cek file GeoJSON

## ✅ Checklist

- [ ] Server backend sudah berjalan (`npm run backend`)
- [ ] File GeoJSON ada di `data/batas_kecamatan.json`
- [ ] Browser console tidak menampilkan error
- [ ] Checkbox "Kecamatan Boundaries" di panel layer sudah dicentang
- [ ] Zoom level cukup untuk melihat area (zoom out jika perlu)

## 🎯 Quick Fix

### Opsi 1: Jalankan dengan Server Backend
```bash
# Dari root directory
npm run backend

# Buka browser
http://localhost:3000/map.html
```

### Opsi 2: Install Backend Dependencies (jika belum)
```bash
cd backend
npm install
npm run dev
```

### Opsi 3: Cek Data di Console
Buka console di browser dan ketik:
```javascript
// Cek apakah layer ada
map.getLayers().getArray()

// Cek apakah ada features
map.getLayers().getArray().find(l => l.get('name') === 'kecamatan')?.getSource().getFeatures()
```

## 🔧 Manual Test

Jika masih tidak berhasil, test manual dengan membuat file `test-geojson.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test GeoJSON</title>
</head>
<body>
  <h1>Test Load GeoJSON</h1>
  <pre id="result"></pre>
  
  <script>
    fetch('./data/batas_kecamatan.json')
      .then(r => r.json())
      .then(data => {
        document.getElementById('result').textContent = 
          JSON.stringify(data, null, 2).substring(0, 500);
        console.log('GeoJSON loaded:', data);
      })
      .catch(err => {
        document.getElementById('result').textContent = 'Error: ' + err;
        console.error(err);
      });
  </script>
</body>
</html>
```

## 📞 Masih Bermasalah?

1. Pastikan Anda buka peta via server: `http://localhost:3000/map.html`
2. Cek browser console untuk error messages
3. Verifikasi file `data/batas_kecamatan.json` ada dan valid JSON
4. Zoom out di peta (koordinat mungkin di luar view)
5. Toggle checkbox "Kecamatan Boundaries" off/on

## 📝 Koordinat Deli Serdang

Center: `[98.8664, 3.5507]` (Longitude, Latitude)
- Longitude: 98.8664° E
- Latitude: 3.5507° N

Jika peta tidak centered dengan benar, data GeoJSON mungkin tidak terload.
