# WebGIS Deli Serdang - Backend

Backend server untuk aplikasi WebGIS Deli Serdang menggunakan Node.js dan Express.js.

## Prasyarat

- Node.js (versi 16 atau lebih baru)
- npm atau yarn

## Instalasi

1. Masuk ke folder backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Buat file `.env` dari `.env.example`:
```bash
cp .env.example .env
```

4. Sesuaikan konfigurasi di file `.env` jika diperlukan.

## Menjalankan Server

### Mode Development (dengan auto-reload):
```bash
npm run dev
```

### Mode Production:
```bash
npm start
```

Server akan berjalan di `http://localhost:3000` (atau port yang ditentukan di file .env).

## API Endpoints

### Health Check
- **GET** `/api/health` - Mengecek status server

### Data Endpoints
- **GET** `/api/data/kecamatan` - Mendapatkan data kecamatan

## Struktur Folder

```
backend/
├── server.js          # File utama server
├── package.json       # Dependencies dan scripts
├── .env.example       # Contoh konfigurasi environment
├── .gitignore         # File yang diabaikan git
└── README.md          # Dokumentasi ini
```

## Development

Untuk menambahkan endpoint API baru, edit file `server.js` dan tambahkan route sesuai kebutuhan.

## Environment Variables

- `PORT` - Port server (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Catatan

Server ini sudah dikonfigurasi untuk:
- ✅ Serve static files dari root directory
- ✅ CORS enabled
- ✅ JSON body parser
- ✅ Error handling
- ✅ 404 handler

## Lisensi

ISC
