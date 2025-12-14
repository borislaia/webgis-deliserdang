# Photo Modal Refactoring

## 📋 Overview

Refactoring modal foto untuk memisahkan logika antara **popup feature** dan **card slider** menggunakan custom hook dan komponen terpisah.

## 🎯 Masalah yang Diselesaikan

1. ✅ **Konflik Potensial**: Sebelumnya kedua sumber (popup & card slider) menggunakan state yang sama
2. ✅ **Duplikasi Kode**: Modal UI didefinisikan inline dengan banyak duplikasi
3. ✅ **Maintainability**: Sulit untuk maintain dan debug karena logika tercampur

## 🔧 Solusi

### 1. Custom Hook: `usePhotoModal` (`/hooks/usePhotoModal.ts`)

**Fitur:**
- ✨ Mengelola state modal foto (isOpen, photos, index, source)
- 🎹 Keyboard navigation (Arrow keys, Escape)
- 🔄 Navigation functions (next, prev, goTo)
- 🏷️ Source tracking ('popup' atau 'card-slider')

**API:**
```typescript
const photoModal = usePhotoModal();

// Open modal
photoModal.openModal(photos, index, 'popup'); // dari popup feature
photoModal.openModal(photos, index, 'card-slider'); // dari card slider

// Navigation
photoModal.nextPhoto();
photoModal.prevPhoto();
photoModal.goToPhoto(index);
photoModal.closeModal();

// State
photoModal.isOpen
photoModal.currentPhotoSrc
photoModal.currentPhotoIndex
photoModal.photos
photoModal.source
```

### 2. Komponen: `PhotoModal` (`/components/PhotoModal.tsx`)

**Fitur:**
- 🎨 UI modal yang terpisah dan reusable
- ⌨️ Keyboard shortcuts (←, →, Esc)
- 🖱️ Click navigation (prev/next buttons, dots indicators)
- 📱 Responsive design
- 🏷️ Source badge untuk debugging ('Feature Popup' atau 'Card Slider')
- ❌ Error handling untuk foto yang gagal dimuat

**Props:**
```typescript
interface PhotoModalProps {
  isOpen: boolean;
  currentPhotoSrc: string | null;
  currentPhotoIndex: number;
  photos: string[];
  source: PhotoModalSource | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToPhoto: (index: number) => void;
  onPhotoError?: (url: string) => void;
}
```

### 3. Update `IrrigationMapView.tsx`

**Perubahan:**
```typescript
// Sebelum (menggunakan multiple state)
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalImgSrc, setModalImgSrc] = useState(null);
const [modalPhotoIndex, setModalPhotoIndex] = useState(0);
const [modalPhotos, setModalPhotos] = useState([]);

// Sesudah (menggunakan custom hook)
const photoModal = usePhotoModal();

// Popup feature
photoModal.openModal(allPhotos, index, 'popup');

// Card slider
photoModal.openModal(randomPhotos, index, 'card-slider');
```

## ✅ Manfaat

1. **Separation of Concerns**: Logika modal terpisah dari UI map
2. **Reusability**: Hook dan component bisa digunakan di komponen lain
3. **Type Safety**: Full TypeScript support dengan proper types
4. **Source Tracking**: Bisa track foto berasal dari popup atau card slider
5. **Maintainability**: Lebih mudah untuk maintain dan extend
6. **No Conflicts**: Tidak ada lagi potensi konflik antara dua sumber foto
7. **Better UX**: Source badge membantu user memahami konteks foto

## 🧪 Testing

✅ Build berhasil tanpa error  
✅ Foto pada popup feature bisa diklik  
✅ Foto pada card slider bisa diklik  
✅ Modal menampilkan foto sesuai source  
✅ Navigation (prev/next/dots) berfungsi  
✅ Keyboard shortcuts berfungsi  
✅ Source badge ditampilkan dengan benar  

## 📁 File yang Dibuat/Diubah

### Baru:
- ✨ `/hooks/usePhotoModal.ts` - Custom hook untuk modal management
- ✨ `/components/PhotoModal.tsx` - Komponen modal terpisah

### Diubah:
- 🔧 `/components/IrrigationMapView.tsx` - Menggunakan hook dan komponen baru

## 🚀 Cara Penggunaan

### Di Popup Feature:
```typescript
// Saat foto diklik di popup
const openModalHandler = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
  const photoIndex = allPhotos.indexOf(url);
  photoModal.openModal(allPhotos, photoIndex, 'popup');
};
```

### Di Card Slider:
```typescript
// Saat foto diklik di card slider
const openPhotoModalFromCard = (index: number) => {
  if (randomPhotos.length > 0 && index >= 0 && index < randomPhotos.length) {
    photoModal.openModal(randomPhotos, index, 'card-slider');
  }
};
```

## 🎨 Source Badge

Modal sekarang menampilkan badge yang menunjukkan sumber foto:
- 🏷️ **"Feature Popup"** - Foto dari popup feature di peta
- 🏷️ **"Card Slider"** - Foto dari card slider

Badge ini bisa dihapus atau disembunyikan jika tidak diperlukan dengan menghapus bagian ini di `PhotoModal.tsx`:

```typescript
{/* Source badge (for debugging/clarity) */}
{source && (
  <div style={{ ... }}>
    {source === 'popup' ? 'Feature Popup' : 'Card Slider'}
  </div>
)}
```

## 📝 Notes

- Hook `usePhotoModal` menggunakan `useCallback` untuk optimasi performa
- Modal UI menggunakan inline styles untuk portabilitas
- Source tracking membantu debugging dan analytics
- Failed photos tracking tetap dihandle di parent component (`IrrigationMapView`)
