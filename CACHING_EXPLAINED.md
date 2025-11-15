# Caching: Penjelasan Blak-Blakan untuk Orang Awam

## Apa Itu Caching? (Dengan Bahasa Manusia)

Bayangkan kamu punya warung kopi. Setiap kali ada customer minta kopi, kamu harus:
1. Lari ke pasar beli biji kopi
2. Pulang ke warung
3. Giling biji kopi
4. Seduh kopi
5. Kasih ke customer

**INI LAMBAT BANGET!** Customer udah kabur duluan.

**Solusinya:** Simpan kopi yang udah diseduh di termos. Jadi kalau ada customer minta kopi lagi, langsung kasih dari termos. **INI CEPAT!**

Nah, **caching itu sama kayak termos kopi**. Simpan data yang sering dipakai, jadi nggak perlu ambil dari database terus-terusan.

---

## Masalah di Project Kamu Sekarang

Coba liat kode kamu di `dashboard/page.tsx`:

```typescript
// Setiap kali user buka panel "Daerah Irigasi", kamu fetch data lagi
useEffect(() => {
  if (activePanel !== 'di') return;
  // ... fetch dari Supabase ...
}, [activePanel]);
```

**Masalahnya:**
- User buka panel → fetch data
- User tutup panel → data hilang
- User buka lagi → fetch lagi (WASTE!)
- User refresh halaman → fetch lagi (WASTE!)
- User lain buka halaman yang sama → fetch lagi (WASTE!)

**Ini kayak kamu beli kopi baru setiap kali customer datang, padahal kopi di termos masih panas.**

---

## Tiga Opsi Caching

### 1. Next.js Revalidation (Yang Paling Sederhana)

**Apa itu?**
- Next.js punya sistem caching built-in
- Data di-cache di server
- Bisa set "refresh setiap X detik" atau "refresh kalau ada perubahan"

**Kapan pakai?**
- ✅ Data yang jarang berubah (daftar daerah irigasi, data master)
- ✅ Data yang sama untuk semua user
- ✅ Nggak perlu real-time update

**Cara pakai:**
```typescript
// Di API route atau Server Component
export const revalidate = 60; // Refresh setiap 60 detik
```

**Kelebihan:**
- ✅ Udah built-in, nggak perlu install apa-apa
- ✅ Ringan, nggak nambah bundle size
- ✅ Cocok untuk data statis/semi-statis

**Kekurangan:**
- ❌ Nggak bisa invalidate cache dari client side
- ❌ Semua user dapet data yang sama (nggak bisa personalisasi)
- ❌ Kalau data berubah, harus nunggu sampai revalidate

**Analogi:** Termos kopi yang otomatis ganti isi setiap jam, tapi kamu nggak bisa minta ganti sekarang juga.

---

### 2. SWR (Stale-While-Revalidate)

**Apa itu?**
- Library kecil buat fetch data di client side
- Prinsipnya: **Kasih data lama dulu, terus update di background**
- Otomatis revalidate kalau user fokus ke tab lagi

**Kapan pakai?**
- ✅ Data yang perlu real-time update
- ✅ Data yang bisa berbeda per user
- ✅ Perlu optimistic updates (update UI dulu, baru sync ke server)

**Cara pakai:**
```typescript
import useSWR from 'swr';

function Dashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/daerah-irigasi',
    fetcher,
    { revalidateOnFocus: true } // Auto refresh kalau user balik ke tab
  );
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  return <div>{data}</div>;
}
```

**Kelebihan:**
- ✅ Ringan (cuma ~4KB gzipped)
- ✅ Auto revalidate kalau user fokus ke tab
- ✅ Bisa invalidate cache manual
- ✅ Bisa share cache antar component

**Kekurangan:**
- ❌ Harus install library tambahan
- ❌ Cuma untuk client-side (React components)
- ❌ Nggak bisa dipakai di Server Components

**Analogi:** Termos kopi yang otomatis cek apakah kopinya masih fresh, kalau udah basi langsung ganti. Tapi kamu juga bisa minta ganti sekarang juga kalau mau.

---

### 3. React Query (TanStack Query)

**Apa itu?**
- Library yang lebih powerful dari SWR
- Punya fitur lebih lengkap: mutations, infinite queries, pagination, dll
- Lebih cocok untuk aplikasi kompleks

**Kapan pakai?**
- ✅ Aplikasi yang kompleks dengan banyak state management
- ✅ Perlu fitur advanced (infinite scroll, pagination, optimistic updates)
- ✅ Team yang udah familiar dengan React Query

**Cara pakai:**
```typescript
import { useQuery } from '@tanstack/react-query';

function Dashboard() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['daerah-irigasi'],
    queryFn: () => fetch('/api/daerah-irigasi').then(r => r.json()),
    staleTime: 60000, // Data dianggap fresh selama 60 detik
  });
  
  // ... sama kayak SWR
}
```

**Kelebihan:**
- ✅ Fitur lengkap (mutations, infinite queries, dll)
- ✅ Developer experience bagus
- ✅ Punya DevTools buat debugging
- ✅ Bisa dipakai untuk state management yang kompleks

**Kekurangan:**
- ❌ Lebih berat dari SWR (~13KB gzipped)
- ❌ Learning curve lebih tinggi
- ❌ Overkill untuk aplikasi sederhana

**Analogi:** Termos kopi premium dengan fitur WiFi, timer, dan bisa pesan kopi baru via app. Keren sih, tapi kalau cuma butuh kopi panas, mungkin terlalu ribet.

---

## Rekomendasi untuk Project Kamu

### **Pakai Next.js Revalidation Dulu**

**Kenapa?**
1. **Project kamu masih sederhana** - Data daerah irigasi, user list, dll itu data yang jarang berubah
2. **Udah built-in** - Nggak perlu install library tambahan
3. **Lebih ringan** - Nggak nambah bundle size
4. **Cocok untuk WebGIS** - Data geografis biasanya statis/semi-statis

**Implementasi:**

```typescript
// app/api/daerah-irigasi/route.ts
export const revalidate = 300; // Refresh setiap 5 menit

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from('daerah_irigasi')
    .select('*')
    .order('k_di');
  
  return NextResponse.json(data);
}
```

```typescript
// app/dashboard/page.tsx
// Ganti useEffect jadi fetch biasa
const response = await fetch('/api/daerah-irigasi');
const data = await response.json();
```

**Kalau nanti perlu real-time update atau optimisasi lebih lanjut, baru pertimbangkan SWR.**

---

### Kapan Harus Pakai SWR?

Pakai SWR kalau:
- ✅ Data perlu update real-time (misalnya: notifikasi, chat, live tracking)
- ✅ User bisa edit data dan perlu langsung terlihat perubahan
- ✅ Perlu optimisasi untuk user experience (loading state yang lebih smooth)

**Contoh kasus di project kamu:**
- Kalau ada fitur "live update" untuk status irigasi → pakai SWR
- Kalau ada fitur chat/komentar di peta → pakai SWR
- Kalau cuma tampilin data statis → cukup Next.js revalidation

---

### Kapan Harus Pakai React Query?

Pakai React Query kalau:
- ✅ Aplikasi udah kompleks dengan banyak state
- ✅ Perlu fitur advanced (infinite scroll, complex pagination)
- ✅ Team udah familiar dengan React Query
- ✅ Perlu state management yang lebih powerful

**Untuk project kamu sekarang, React Query itu OVERKILL.**

---

## Kesimpulan (TL;DR)

1. **Next.js Revalidation** = Termos kopi sederhana, cukup untuk kebutuhan dasar
2. **SWR** = Termos kopi dengan auto-refresh, cocok untuk data yang perlu update
3. **React Query** = Termos kopi premium dengan semua fitur, overkill untuk project sederhana

**Untuk project kamu sekarang: Pakai Next.js Revalidation dulu. Kalau nanti perlu lebih, baru upgrade ke SWR.**

---

## Quick Start: Implementasi Next.js Revalidation

1. Buat API route dengan revalidation:
```typescript
// app/api/daerah-irigasi/route.ts
export const revalidate = 300; // 5 menit
```

2. Ganti fetch di component jadi fetch biasa (bukan useEffect):
```typescript
// Server Component (recommended)
async function Dashboard() {
  const res = await fetch('http://localhost:3000/api/daerah-irigasi');
  const data = await res.json();
  return <div>{/* render data */}</div>;
}
```

3. Kalau harus pakai Client Component, tetap bisa fetch tapi cache-nya kurang optimal:
```typescript
// Client Component (kurang optimal, tapi bisa)
const res = await fetch('/api/daerah-irigasi', { 
  next: { revalidate: 300 } 
});
```

**Selesai! Udah lebih cepat dan efisien.**
