# Arahan Implementasi Perbaikan

Dokumen ini berisi langkah-langkah yang **HARUS ANDA LAKUKAN** setelah semua perubahan kode selesai.

## ⚠️ PENTING: Langkah-Langkah Wajib

### 1. Install Dependencies Baru

Jalankan perintah berikut untuk menginstall dependencies baru dan menghapus yang deprecated:

```bash
npm install @supabase/ssr
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 2. Update Environment Variables

#### Di Vercel/Supabase Dashboard:

**HAPUS** environment variable berikut (jika ada):
- `NEXT_PUBLIC_BYPASS_AUTH` ❌ (tidak aman, diekspos ke client)

**TAMBAHKAN/UPDATE** environment variables berikut:

**Untuk Next.js App (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (sudah ada, pastikan terisi)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (sudah ada, pastikan terisi)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (sudah ada, pastikan terisi)
- `BYPASS_AUTH` (opsional, server-only, untuk preview deployments)
- `PREVIEW_SECRET_TOKEN` (opsional, untuk preview dengan bypass auth)

**Untuk Supabase Edge Function:**
- `ALLOWED_ORIGIN` - Set ke domain production Anda (contoh: `https://yourdomain.com`)
- `PRODUCTION_URL` - Set ke URL production (contoh: `https://yourdomain.com`)

**Cara Set di Supabase Dashboard:**
1. Buka Supabase Dashboard → Project Settings → Edge Functions
2. Tambahkan environment variables:
   - `ALLOWED_ORIGIN=https://yourdomain.com`
   - `PRODUCTION_URL=https://yourdomain.com`

**Cara Set di Vercel:**
1. Buka Vercel Dashboard → Project Settings → Environment Variables
2. Tambahkan/update variables sesuai di atas

### 3. Update CORS di Edge Function

**PENTING:** Ganti `'https://yourdomain.com'` di file `supabase/functions/import-irrigation-data/index.ts` dengan domain production Anda yang sebenarnya.

Atau lebih baik, set environment variable `ALLOWED_ORIGIN` di Supabase Dashboard seperti yang dijelaskan di atas.

### 4. Test Setelah Migrasi

Setelah semua dependencies terinstall dan environment variables diupdate:

1. **Test Login:**
   ```bash
   npm run dev
   ```
   - Buka http://localhost:3000/login
   - Coba login dengan akun yang ada
   - Pastikan redirect bekerja dengan baik

2. **Test Admin Routes:**
   - Login sebagai admin
   - Akses `/dashboard` → panel "Users"
   - Pastikan dapat melihat dan mengubah role user

3. **Test Edge Function:**
   - Coba import data melalui UI
   - Pastikan CORS tidak error di browser console

4. **Test Build:**
   ```bash
   npm run build
   ```
   - Pastikan build berhasil tanpa error

### 5. Run Tests

```bash
npm test
```

Pastikan semua tests pass. Jika ada yang fail, perbaiki sesuai error message.

### 6. Deploy ke Production

Setelah semua test lokal berhasil:

1. Commit semua perubahan:
   ```bash
   git add .
   git commit -m "feat: migrate to @supabase/ssr and implement security improvements"
   ```

2. Push ke repository:
   ```bash
   git push
   ```

3. Monitor deployment di Vercel dashboard

4. Setelah deploy, test lagi di production:
   - Login/logout
   - Admin routes
   - Edge Function calls

## 📋 Checklist Pre-Deployment

- [ ] Dependencies baru terinstall (`@supabase/ssr`)
- [ ] Dependencies lama terhapus (`@supabase/auth-helpers-*`)
- [ ] Environment variables sudah diupdate di Vercel
- [ ] Environment variables sudah diupdate di Supabase (untuk Edge Function)
- [ ] CORS origin sudah diset ke domain production yang benar
- [ ] `NEXT_PUBLIC_BYPASS_AUTH` sudah dihapus dari environment variables
- [ ] Test lokal berhasil (login, admin routes, build)
- [ ] Tests pass (`npm test`)
- [ ] Code sudah di-commit dan push

## 🔍 Troubleshooting

### Error: "Missing required environment variables"
- Pastikan semua env vars sudah di-set di Vercel/Supabase
- Check `.env.local` untuk development

### Error: CORS di Edge Function
- Pastikan `ALLOWED_ORIGIN` sudah diset di Supabase Dashboard
- Check bahwa origin request sesuai dengan yang di-set

### Error: "Cannot find module '@supabase/ssr'"
- Jalankan `npm install @supabase/ssr`
- Pastikan `node_modules` sudah ter-update

### Login tidak bekerja setelah migrasi
- Check browser console untuk error
- Pastikan cookies dapat di-set (check browser settings)
- Verify environment variables sudah benar

### Build error
- Check TypeScript errors: `npm run type-check`
- Pastikan semua imports sudah benar
- Check bahwa semua dependencies terinstall

## 📞 Support

Jika ada masalah setelah implementasi, check:
1. Browser console untuk client-side errors
2. Vercel logs untuk server-side errors
3. Supabase logs untuk Edge Function errors

---

**Catatan:** Semua perubahan kode sudah dilakukan. Anda hanya perlu melakukan langkah-langkah di atas untuk menyelesaikan implementasi.
