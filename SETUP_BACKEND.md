# Panduan Setup Backend Node.js - WebGIS Deli Serdang

## 🚀 Quick Start

### Opsi 1: Install dan Jalankan dari Root
```bash
npm run backend:install    # Install dependencies
npm run backend           # Jalankan server (development mode)
```

### Opsi 2: Install dan Jalankan dari Folder Backend
```bash
cd backend
npm install
npm run dev              # Development mode dengan auto-reload
# atau
npm start                # Production mode
```

## 📁 Struktur Backend

```
backend/
├── config/              # Konfigurasi aplikasi
│   └── database.js      # Konfigurasi database
├── controllers/         # Controller (logic bisnis)
│   └── dataController.js
├── middleware/          # Custom middleware
│   ├── errorHandler.js
│   └── logger.js
├── routes/             # Route definitions
│   ├── api.js          # API routes
│   └── auth.js         # Authentication routes
├── server.js           # Entry point aplikasi
├── package.json        # Dependencies
├── .env.example        # Contoh environment variables
├── .gitignore          # Git ignore rules
└── README.md           # Dokumentasi backend
```

## 🔧 Konfigurasi

1. Copy file `.env.example` menjadi `.env`:
```bash
cd backend
cp .env.example .env
```

2. Edit file `.env` sesuai kebutuhan:
```env
PORT=3000
NODE_ENV=development
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Status server

### Data GIS
- `GET /api/data/kecamatan` - Data kecamatan
- `GET /api/data/irigasi` - Data daerah irigasi
- `GET /api/data/sda` - Data pemanfaatan SDA
- `GET /api/data/bencana` - Data rawan bencana
- `GET /api/data/infrastruktur` - Data infrastruktur SDA

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Status autentikasi

## 🧪 Testing API

### Menggunakan curl:
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Menggunakan browser:
Buka `http://localhost:3000/api/health` di browser

## 📦 Dependencies Utama

- **express** - Web framework
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **body-parser** - Parse request body
- **nodemon** - Auto-reload (dev)

## 🔐 Next Steps

1. **Database Integration**: Uncomment kode di `config/database.js` dan tambahkan credentials database
2. **Authentication**: Implementasi JWT atau session-based auth di `routes/auth.js`
3. **Data Layer**: Tambahkan models dan database queries
4. **Validation**: Tambahkan input validation middleware
5. **API Documentation**: Generate API docs dengan Swagger/OpenAPI

## 🐛 Troubleshooting

### Port sudah digunakan
Ganti PORT di file `.env`:
```env
PORT=3001
```

### Dependencies error
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Catatan

- Server otomatis serve static files dari root directory
- CORS sudah enabled untuk development
- Error handling sudah dikonfigurasi
- Request logging sudah aktif di console

Untuk informasi lebih detail, lihat [Backend README](backend/README.md)
