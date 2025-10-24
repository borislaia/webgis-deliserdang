# 🚀 Panduan Deployment ke Vercel - WebGIS Deli Serdang

## 📋 Prerequisites

1. **Akun Vercel** - Daftar di [vercel.com](https://vercel.com)
2. **Akun Supabase** - Pastikan proyek Supabase sudah aktif
3. **Git Repository** - Proyek sudah di-push ke GitHub/GitLab

## 🔧 Langkah-langkah Deployment

### 1. **Persiapan Environment Variables**

Sebelum deploy, siapkan environment variables di Vercel:

#### Di Vercel Dashboard:
1. Buka proyek Anda di Vercel
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan variables berikut:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://yyagythhwzdncantoszf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YWd5dGhod3pkbmNhbnRvc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzkzMzcsImV4cCI6MjA3NjE1NTMzN30.R1fbe6pwq6d7ZJ5posqv2m4lhWhdnN9GxeJx-NDv0Yo
```

**⚠️ PENTING:** Ganti dengan Supabase keys Anda sendiri!

### 2. **Deploy ke Vercel**

#### Opsi A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [your-username]
# - Link to existing project? N
# - Project name? webgis-deliserdang
# - Directory? ./
# - Override settings? N
```

#### Opsi B: Deploy via GitHub Integration
1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Klik **"New Project"**
4. Import repository dari GitHub
5. Vercel akan auto-detect Vite configuration
6. Set environment variables
7. Klik **"Deploy"**

### 3. **Konfigurasi Supabase untuk Production**

#### A. Row Level Security (RLS)
Pastikan RLS sudah diaktifkan di Supabase:

```sql
-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### B. CORS Configuration
Di Supabase Dashboard → Settings → API:
- Tambahkan domain Vercel ke **Additional URLs**
- Format: `https://your-app-name.vercel.app`

### 4. **Test Deployment**

Setelah deploy, test fitur-fitur berikut:

1. **Homepage** - `https://your-app.vercel.app/`
2. **Map** - `https://your-app.vercel.app/map.html`
3. **Login** - `https://your-app.vercel.app/login.html`
4. **Dashboard** - `https://your-app.vercel.app/dashboard.html`

### 5. **Verifikasi Fitur**

#### ✅ Checklist Testing:
- [ ] Halaman utama load dengan benar
- [ ] Peta menampilkan GeoJSON data
- [ ] Login/Register berfungsi
- [ ] Authentication state persist
- [ ] Dashboard accessible setelah login
- [ ] Layer toggle berfungsi
- [ ] Popup info kecamatan muncul

## 🔍 Troubleshooting

### GeoJSON Tidak Muncul?
1. **Cek Console** - Buka Developer Tools (F12)
2. **Cek Network Tab** - Pastikan request ke `/data/batas_kecamatan.json` berhasil
3. **Cek CORS** - Pastikan domain Vercel sudah ditambahkan di Supabase

### Login Tidak Berfungsi?
1. **Cek Environment Variables** - Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` benar
2. **Cek Supabase Auth** - Pastikan email confirmation sudah diaktifkan
3. **Cek RLS Policies** - Pastikan policies sudah dibuat dengan benar

### Build Error?
1. **Cek Dependencies** - Pastikan semua dependencies terinstall
2. **Cek Vite Config** - Pastikan konfigurasi build benar
3. **Cek File Structure** - Pastikan semua file HTML ada

## 📁 Struktur File Setelah Cleanup

```
webgis-deliserdang/
├── assets/                 # Static assets
├── css/                   # Stylesheets
├── data/                  # GeoJSON data
├── js/                    # JavaScript modules
│   ├── config/
│   │   └── supabase.js    # Supabase configuration
│   └── utils/
├── index.html             # Homepage
├── login.html             # Login page
├── map.html               # Map page
├── dashboard.html         # Dashboard page
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── vercel.json            # Vercel configuration
└── .env.example           # Environment variables template
```

## 🎯 Keuntungan Arsitektur Ini

1. **Sederhana** - Tidak perlu maintain backend server
2. **Cost Effective** - Hanya bayar Vercel (gratis untuk hobby)
3. **Scalable** - Supabase handle scaling otomatis
4. **Fast** - CDN Vercel + Supabase optimal
5. **Secure** - RLS di Supabase untuk security

## 📞 Support

Jika ada masalah:
1. Cek [Vercel Documentation](https://vercel.com/docs)
2. Cek [Supabase Documentation](https://supabase.com/docs)
3. Cek console browser untuk error messages

---

**Selamat! WebGIS Deli Serdang siap di-deploy ke Vercel! 🎉**