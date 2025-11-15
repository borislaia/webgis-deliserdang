# ✅ Verifikasi Setup - Checklist

Gunakan checklist ini untuk memverifikasi bahwa semua setup sudah benar.

## 🔍 Pre-Deployment Checks

### 1. Code Verification ✅
- [x] `package.json` sudah diupdate dengan `@supabase/ssr`
- [x] Dependencies lama (`@supabase/auth-helpers-*`) sudah dihapus dari `package.json`
- [x] Semua file sudah menggunakan `@supabase/ssr`
- [x] Tidak ada import dari `@supabase/auth-helpers-*` di code
- [x] Middleware sudah diupdate
- [x] Semua API routes sudah diupdate

### 2. Environment Variables di Vercel ⚠️

**Check di Vercel Dashboard → Settings → Environment Variables:**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - ✅ Harus ada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - ✅ Harus ada  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - ✅ Harus ada
- [ ] `NEXT_PUBLIC_BYPASS_AUTH` - ❌ **HARUS DIHAPUS** (jika masih ada)

**OPSIONAL (untuk preview deployments):**
- [ ] `BYPASS_AUTH` - Opsional, server-only
- [ ] `PREVIEW_SECRET_TOKEN` - Opsional, untuk preview dengan bypass

### 3. Environment Variables di Supabase ⚠️

**Check di Supabase Dashboard → Edge Functions → Settings:**

- [ ] `ALLOWED_ORIGIN` - ✅ **HARUS ADA** dan set ke domain production Anda
  - Contoh: `https://yourproject.vercel.app`
  - **PENTING:** Harus sesuai dengan domain Vercel Anda yang sebenarnya!

**OPSIONAL:**
- [ ] `PRODUCTION_URL` - Opsional, fallback
- [ ] `ENVIRONMENT` - Opsional, set ke `production`

### 4. Build Verification ✅

**Check di Vercel Dashboard → Deployments:**

- [ ] Build berhasil tanpa error
- [ ] Tidak ada error "Cannot find module '@supabase/ssr'"
- [ ] Tidak ada error "Cannot find module '@supabase/auth-helpers-*'"
- [ ] Build logs menunjukkan dependencies terinstall dengan benar

## 🧪 Post-Deployment Tests

Setelah deployment selesai, test berikut:

### Test 1: Authentication ✅
- [ ] Buka aplikasi di browser
- [ ] Akses `/login` - halaman login muncul
- [ ] Login dengan akun yang valid - berhasil redirect ke dashboard
- [ ] Logout - berhasil redirect ke login
- [ ] Akses `/dashboard` tanpa login - redirect ke login

### Test 2: Admin Routes ✅
- [ ] Login sebagai admin
- [ ] Akses `/dashboard` - berhasil
- [ ] Klik panel "Users" - list users muncul
- [ ] Coba ubah role user (bukan admin lain) - berhasil
- [ ] Coba ubah role sendiri - tidak bisa (sesuai expected)

### Test 3: Edge Function (CORS) ✅
- [ ] Login sebagai admin
- [ ] Akses halaman import data
- [ ] Buka browser console (F12)
- [ ] Coba import data GeoJSON
- [ ] **TIDAK ADA** CORS error di console
- [ ] Import berhasil atau error message muncul (bukan CORS error)

### Test 4: Browser Console ✅
- [ ] Buka browser console (F12)
- [ ] Check **TIDAK ADA** error berikut:
  - ❌ CORS errors
  - ❌ "Cannot find module" errors
  - ❌ Authentication errors
  - ❌ Network errors (kecuali expected 404, dll)

### Test 5: Error Handling ✅
- [ ] Test dengan invalid credentials - error message muncul (user-friendly)
- [ ] Test dengan network offline - error message muncul
- [ ] Test dengan invalid data - error message muncul

## 🔧 Troubleshooting Guide

### Jika Build Error

**Error: "Cannot find module '@supabase/ssr'"**
- ✅ **Solusi:** Pastikan `package.json` sudah ter-update (sudah saya lakukan)
- ✅ Trigger rebuild di Vercel
- ✅ Check build logs untuk confirm

**Error: "Cannot find module '@supabase/auth-helpers-*'"**
- ✅ **Solusi:** Pastikan dependencies lama sudah dihapus dari `package.json` (sudah saya lakukan)
- ✅ Trigger rebuild di Vercel

**Error: TypeScript errors**
- ✅ **Solusi:** Check build logs untuk detail
- ✅ Pastikan semua imports sudah benar

### Jika CORS Error

**Error di browser console: "CORS policy blocked"**
- ⚠️ **Solusi:** 
  1. Pastikan `ALLOWED_ORIGIN` sudah diset di Supabase Dashboard
  2. Pastikan domain di `ALLOWED_ORIGIN` sesuai dengan domain Vercel Anda
  3. Check bahwa request origin sesuai dengan yang di-set
  4. Redeploy Edge Function jika perlu

### Jika Login Tidak Bekerja

**Login tidak redirect atau error**
- ⚠️ **Solusi:**
  1. Check browser console untuk error messages
  2. Verify environment variables di Vercel sudah benar
  3. Check network tab untuk melihat request/response
  4. Pastikan cookies dapat di-set (tidak dalam incognito mode)
  5. Clear browser cache dan cookies

### Jika Admin Routes Tidak Bekerja

**Admin routes tidak accessible atau error**
- ⚠️ **Solusi:**
  1. Verify user role adalah 'admin' di Supabase Dashboard
  2. Check browser console untuk error
  3. Verify `SUPABASE_SERVICE_ROLE_KEY` sudah benar di Vercel
  4. Check network tab untuk API calls

## 📊 Verification Summary

Setelah semua checklist di atas selesai:

- ✅ **Code:** Semua sudah benar
- ⚠️ **Environment Variables:** Perlu diverifikasi manual
- ⚠️ **Build:** Perlu dicek di Vercel
- ⚠️ **Tests:** Perlu dilakukan setelah deploy

## 🎯 Quick Verification Commands

Jika Anda punya akses ke terminal (opsional):

```bash
# Check package.json sudah benar
cat package.json | grep "@supabase/ssr"

# Check tidak ada auth-helpers di dependencies
cat package.json | grep "auth-helpers" || echo "✅ Tidak ada auth-helpers"

# Check semua file menggunakan @supabase/ssr
grep -r "@supabase/auth-helpers" --exclude-dir=node_modules --exclude="*.md" || echo "✅ Tidak ada auth-helpers di code"
```

## ✨ Final Checklist

Sebelum consider selesai:

- [ ] Semua environment variables sudah di-set dengan benar
- [ ] Build di Vercel berhasil
- [ ] Semua tests di atas sudah dilakukan dan pass
- [ ] Tidak ada error di browser console
- [ ] Tidak ada CORS error
- [ ] Login/logout bekerja normal
- [ ] Admin routes dapat diakses
- [ ] Edge Function tidak ada CORS error

---

**Status:** Code sudah 100% selesai. Verifikasi setup environment variables dan test aplikasi setelah deploy.
