# WebGIS Deli Serdang

Aplikasi WebGIS (Web-based Geographic Information System) untuk Kabupaten Deli Serdang.

## Struktur Proyek

```
webgis-deliserdang/
├── backend/              # Node.js backend server
│   ├── server.js         # File server utama
│   ├── package.json      # Dependencies backend
│   └── README.md         # Dokumentasi backend
├── assets/               # Asset gambar dan ikon
├── css/                  # Stylesheet
├── js/                   # JavaScript frontend
├── data/                 # Data GIS
├── index.html            # Halaman utama
├── login.html            # Halaman login
├── map.html              # Halaman peta
└── dashboard.html        # Halaman dashboard
```

## Setup dan Instalasi

### Frontend
Frontend dapat dibuka langsung di browser atau melalui server backend.

### Backend (Node.js)

1. Masuk ke folder backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan server:
```bash
npm run dev    # Development mode dengan auto-reload
# atau
npm start      # Production mode
```

Server akan berjalan di `http://localhost:3000`

Untuk detail lebih lanjut, lihat [Backend README](backend/README.md).

## Fitur

- 🗺️ Peta interaktif berbasis web
- 📊 Dashboard data geografis
- 🔐 Sistem autentikasi
- 📍 Visualisasi data SDA (Sumber Daya Air)
- 🌊 Informasi infrastruktur dan bencana

## Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Maps**: Leaflet/OpenStreetMap (dapat disesuaikan)

## Lisensi

ISC