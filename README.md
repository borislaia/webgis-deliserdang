# WebGIS Deli Serdang (Next.js + Supabase)

Aplikasi WebGIS menggunakan Next.js (App Router, TypeScript), Supabase untuk autentikasi, database, dan Storage, serta OpenLayers untuk peta.

## Arsitektur

```
app/                       # Next.js App Router
  api/                     # Route Handlers (server)
    import-irrigation-data/route.ts  # Port dari Edge Function
  login/                   # Halaman login (public)
  register/                # Halaman register (public)
  map/                     # Halaman peta (protected by middleware)
components/                # Komponen UI
lib/supabase/              # Client & server helpers
public/                    # Static assets
  assets/icons/logo-deliserdang.jpg
  data/batas_kecamatan.json
```

## Prasyarat

Set environment variables di `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...  # URL Supabase Anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # Anon key (client)
SUPABASE_SERVICE_ROLE_KEY=...  # Service role (server-side only)
```

## Menjalankan Lokal

```bash
npm install
npm run dev
# buka http://localhost:3000
```

## Deployment (Vercel)

- Tambahkan env vars di Project Settings Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Deploy via Git.

## Autentikasi

- Login dan Register dengan email/password; tombol OAuth Google tersedia (opsional di Supabase Auth providers).
- Rute `/map` diproteksi via middleware; pengguna tidak login akan diarahkan ke `/login`.

## Peta (OpenLayers)

- Data batas kecamatan dibaca dari `public/data/batas_kecamatan.json`.
- Basemap Google/OSM, tooltip hover, dan popup click sederhana.

## Import Data

- Endpoint `POST /api/import-irrigation-data` memindahkan logika impor dari Edge Function ke Route Handler Next.js menggunakan Service Role Key. Pastikan RLS dan tabel sudah ada sesuai migrasi.

## Pembersihan Framework Lama

- Vite, file HTML statis, dan keluaran `dist/` digantikan oleh Next.js. Data dan aset yang diperlukan dipindahkan ke `public/`.

## Lisensi

MIT