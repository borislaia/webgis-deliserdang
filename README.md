# WebGIS Deli Serdang (Next.js + Supabase)

Aplikasi WebGIS menggunakan Next.js (App Router, TypeScript), Supabase untuk autentikasi, database, dan Storage, serta OpenLayers untuk peta.

## Arsitektur

```
app/                       # Next.js App Router
  api/                     # Route Handlers (server)
    admin/users/route.ts   # Endpoint manajemen role admin
  login/                   # Halaman login (public)
  register/                # Halaman register (public)
  map/                     # Halaman peta (protected by middleware)
components/                # Komponen UI
lib/supabase/              # Client & server helpers
public/                    # Static assets
  assets/icons/logo-deliserdang.png
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

- Impor data irigasi dijalankan lewat Supabase Edge Function `import-irrigation-data`. UI dashboard memanggilnya via `supabase.functions.invoke` sehingga tetap memanfaatkan RLS dan token pengguna (hanya admin yang lolos).
- File GeoJSON dapat tetap diunggah ke bucket `geojson` untuk arsip dan pemrosesan lanjutan (segmentasi saluran, foto ruas 50 m, dsb) oleh Edge Function.

## Role & Akses

- Migrasi menambahkan trigger untuk memastikan semua akun baru otomatis mendapat `role = "user"`, sementara admin awal `barizzzlaia@gmail.com` ditandai sebagai `role = "admin"`.
- Panel `Users` di dashboard dapat digunakan admin untuk mempromosikan/downgrade role. Rute `/api/admin/users` memverifikasi session admin sebelum memakai service role key.
- Fitur manajemen data (import GeoJSON/Excel) dan kontrol edit lain dikunci untuk admin; pengguna biasa hanya dapat melihat data.

## Pembersihan Framework Lama

- Vite, file HTML statis, dan keluaran `dist/` digantikan oleh Next.js. Data dan aset yang diperlukan dipindahkan ke `public/`.

## Lisensi

MIT