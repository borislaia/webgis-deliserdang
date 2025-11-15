# Instruksi Setup untuk Web Development Only

Karena Anda hanya develop di web (tidak pakai CLI), berikut adalah langkah-langkah yang **HARUS ANDA LAKUKAN** melalui dashboard web.

## ✅ Yang Sudah Saya Lakukan (Otomatis)

1. ✅ Update semua kode untuk migrasi ke `@supabase/ssr`
2. ✅ Update `package.json` dengan dependencies baru
3. ✅ Hapus dependencies lama dari `package.json`
4. ✅ Buat semua file konfigurasi (Jest, Prettier, EditorConfig)
5. ✅ Fix semua security issues
6. ✅ Replace semua `any` types
7. ✅ Buat utility functions dan constants
8. ✅ Setup testing infrastructure

## 🔧 Yang Harus Anda Lakukan di Dashboard Web

### 1. Update Environment Variables di Vercel

**Langkah:**
1. Buka Vercel Dashboard → Pilih project Anda
2. Masuk ke **Settings** → **Environment Variables**
3. **HAPUS** variable berikut jika ada:
   - ❌ `NEXT_PUBLIC_BYPASS_AUTH` (tidak aman, harus dihapus)

4. **TAMBAHKAN/VERIFY** variable berikut sudah ada dan benar:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase Anda
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key dari Supabase
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)

5. **OPSIONAL** - Tambahkan untuk preview deployments:
   - `BYPASS_AUTH` = `true` (tanpa prefix NEXT_PUBLIC_, server-only)
   - `PREVIEW_SECRET_TOKEN` = buat token random (contoh: `preview-secret-12345`)

**Catatan:** Setelah update environment variables, **redeploy** aplikasi di Vercel.

### 2. Update Environment Variables di Supabase (Edge Function)

**Langkah:**
1. Buka Supabase Dashboard → Pilih project Anda
2. Masuk ke **Edge Functions** → **Settings** atau **Environment Variables**
3. **TAMBAHKAN** variable berikut:

   ```
   ALLOWED_ORIGIN=https://yourdomain.vercel.app
   ```
   
   Ganti `yourdomain.vercel.app` dengan domain Vercel Anda yang sebenarnya.
   
   Contoh:
   - Development: `ALLOWED_ORIGIN=http://localhost:3000`
   - Production: `ALLOWED_ORIGIN=https://webgis-deliserdang.vercel.app`

4. **OPSIONAL** - Tambahkan:
   ```
   PRODUCTION_URL=https://yourdomain.vercel.app
   ENVIRONMENT=production
   ```

**PENTING:** Set `ALLOWED_ORIGIN` ke domain production Anda yang sebenarnya!

### 3. Update CORS Origin di Code (Jika Perlu)

File `supabase/functions/import-irrigation-data/index.ts` sudah diupdate untuk menggunakan environment variable. Tapi jika environment variable tidak tersedia, akan fallback ke `'https://yourdomain.com'`.

**Jika perlu update fallback:**
1. Buka file `supabase/functions/import-irrigation-data/index.ts`
2. Cari baris sekitar line 106:
   ```typescript
   return Deno.env.get('PRODUCTION_URL') || 'https://yourdomain.com';
   ```
3. Ganti `'https://yourdomain.com'` dengan domain production Anda

**ATAU lebih baik:** Set environment variable `ALLOWED_ORIGIN` di Supabase Dashboard seperti di langkah 2.

### 4. Trigger Rebuild di Vercel

Setelah semua environment variables diupdate:

1. Buka Vercel Dashboard → Project Anda
2. Masuk ke **Deployments**
3. Klik **"Redeploy"** pada deployment terbaru
4. Atau push commit baru ke repository untuk trigger auto-deploy

### 5. Verify Dependencies Terinstall

Vercel akan otomatis install dependencies dari `package.json` saat build. Pastikan build berhasil:

1. Buka Vercel Dashboard → **Deployments**
2. Klik pada deployment terbaru
3. Check **Build Logs**
4. Pastikan tidak ada error seperti:
   - ❌ "Cannot find module '@supabase/ssr'"
   - ❌ "Module not found"

Jika ada error, kemungkinan:
- Dependencies belum terinstall → Tunggu build selesai
- Ada typo di `package.json` → Check file sudah benar

## 🧪 Testing Setelah Deploy

Setelah deployment selesai, test berikut:

### Test 1: Login/Logout
1. Buka aplikasi di browser
2. Coba login dengan akun yang ada
3. Pastikan redirect bekerja
4. Coba logout
5. Pastikan redirect ke login page

### Test 2: Admin Routes
1. Login sebagai admin
2. Akses `/dashboard`
3. Klik panel "Users"
4. Pastikan dapat melihat list users
5. Coba ubah role user (bukan admin lain atau diri sendiri)
6. Pastikan perubahan berhasil

### Test 3: Edge Function (Import Data)
1. Login sebagai admin
2. Akses halaman import data
3. Coba import data GeoJSON
4. Check browser console (F12) → tidak ada CORS error
5. Pastikan import berhasil

### Test 4: Check Browser Console
1. Buka browser console (F12)
2. Check tidak ada error:
   - ❌ CORS errors
   - ❌ "Cannot find module" errors
   - ❌ Authentication errors

## 🔍 Troubleshooting

### Error: "Cannot find module '@supabase/ssr'"
**Solusi:** 
- Pastikan `package.json` sudah ter-update (sudah saya lakukan)
- Trigger rebuild di Vercel
- Check build logs di Vercel untuk memastikan dependencies terinstall

### Error: CORS di Edge Function
**Solusi:**
- Pastikan `ALLOWED_ORIGIN` sudah diset di Supabase Dashboard
- Pastikan origin request sesuai dengan yang di-set
- Check browser console untuk detail error

### Login tidak bekerja
**Solusi:**
- Check browser console untuk error
- Pastikan cookies dapat di-set (check browser settings, tidak dalam incognito)
- Verify environment variables sudah benar di Vercel
- Check network tab untuk melihat request/response

### Build error di Vercel
**Solusi:**
- Check build logs di Vercel untuk detail error
- Pastikan semua environment variables sudah di-set
- Pastikan `package.json` valid (sudah saya perbaiki)
- Pastikan Node.js version sesuai (sudah set di `package.json` engines)

## 📋 Checklist Final

Sebelum consider selesai, pastikan:

- [ ] Environment variables sudah diupdate di Vercel
- [ ] `NEXT_PUBLIC_BYPASS_AUTH` sudah dihapus dari Vercel
- [ ] `ALLOWED_ORIGIN` sudah diset di Supabase Dashboard
- [ ] Domain di `ALLOWED_ORIGIN` sesuai dengan domain production
- [ ] Vercel deployment sudah rebuild/redeploy
- [ ] Build berhasil tanpa error
- [ ] Test login/logout berhasil
- [ ] Test admin routes berhasil
- [ ] Test Edge Function tidak ada CORS error
- [ ] Browser console tidak ada error

## 📞 Jika Ada Masalah

Jika setelah semua langkah di atas masih ada masalah:

1. **Check Vercel Build Logs:**
   - Vercel Dashboard → Deployments → Klik deployment → View Build Logs
   - Cari error messages

2. **Check Browser Console:**
   - F12 → Console tab
   - Screenshot error messages

3. **Check Network Tab:**
   - F12 → Network tab
   - Check failed requests (red)
   - Check response headers untuk CORS issues

4. **Check Supabase Logs:**
   - Supabase Dashboard → Logs → Edge Functions
   - Check error messages

## ✨ Summary

**Yang Sudah Selesai (Otomatis):**
- ✅ Semua kode sudah diupdate
- ✅ `package.json` sudah diupdate dengan dependencies baru
- ✅ Semua file konfigurasi sudah dibuat
- ✅ Security fixes sudah diimplementasikan

**Yang Harus Anda Lakukan (Manual di Dashboard):**
- ⚠️ Update environment variables di Vercel (hapus `NEXT_PUBLIC_BYPASS_AUTH`)
- ⚠️ Set `ALLOWED_ORIGIN` di Supabase Dashboard
- ⚠️ Trigger rebuild/redeploy di Vercel
- ⚠️ Test aplikasi setelah deploy

---

**Catatan:** Semua perubahan kode sudah selesai dan siap untuk deploy. Anda hanya perlu melakukan setup environment variables dan trigger rebuild melalui dashboard web.
