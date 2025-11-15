import { useState, useEffect, useCallback } from 'react';

export type PhotoModalSource = 'popup' | 'card-slider';

interface UsePhotoModalReturn {
  isOpen: boolean;
  currentPhotoSrc: string | null;
  currentPhotoIndex: number;
  photos: string[];
  source: PhotoModalSource | null;
  openModal: (photos: string[], index: number, source: PhotoModalSource) => void;
  closeModal: () => void;
  nextPhoto: () => void;
  prevPhoto: () => void;
  goToPhoto: (index: number) => void;
}

export function usePhotoModal(): UsePhotoModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoSrc, setCurrentPhotoSrc] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [source, setSource] = useState<PhotoModalSource | null>(null);

  // Open modal with photos and initial index
  const openModal = useCallback((photoList: string[], index: number, modalSource: PhotoModalSource) => {
    if (photoList.length === 0 || index < 0 || index >= photoList.length) {
      return;
    }
    setPhotos(photoList);
    setCurrentPhotoIndex(index);
    setCurrentPhotoSrc(photoList[index]);
    setSource(modalSource);
    setIsOpen(true);
  }, []);

  // Close modal and reset state
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentPhotoSrc(null);
    // Keep photos and index for a moment to avoid flicker
    setTimeout(() => {
      setPhotos([]);
      setCurrentPhotoIndex(0);
      setSource(null);
    }, 200);
  }, []);

  // Navigate to next photo
  const nextPhoto = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => {
      const newIndex = (prev + 1) % photos.length;
      setCurrentPhotoSrc(photos[newIndex]);
      return newIndex;
    });
  }, [photos]);

  // Navigate to previous photo
  const prevPhoto = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentPhotoIndex((prev) => {
      const newIndex = (prev - 1 + photos.length) % photos.length;
      setCurrentPhotoSrc(photos[newIndex]);
      return newIndex;
    });
  }, [photos]);

  // Go to specific photo by index
  const goToPhoto = useCallback((index: number) => {
    if (index < 0 || index >= photos.length) return;
    setCurrentPhotoIndex(index);
    setCurrentPhotoSrc(photos[index]);
  }, [photos]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || photos.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        nextPhoto();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, photos, closeModal, nextPhoto, prevPhoto]);

  return {
    isOpen,
    currentPhotoSrc,
    currentPhotoIndex,
    photos,
    source,
    openModal,
    closeModal,
    nextPhoto,
    prevPhoto,
    goToPhoto,
  };
}
