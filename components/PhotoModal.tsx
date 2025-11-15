"use client";

import Image from 'next/image';
import { PhotoModalSource } from '@/hooks/usePhotoModal';

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

export default function PhotoModal({
  isOpen,
  currentPhotoSrc,
  currentPhotoIndex,
  photos,
  source,
  onClose,
  onNext,
  onPrev,
  onGoToPhoto,
  onPhotoError,
}: PhotoModalProps) {
  if (!isOpen || !currentPhotoSrc) return null;

  const hasMultiplePhotos = photos.length > 1;

  return (
    <div
      className={`modal ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
      onClick={onClose}
      style={{
        cursor: 'pointer',
        position: 'fixed',
        inset: 0,
        display: isOpen ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        padding: '20px',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 600,
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            transition: 'background 0.2s ease, transform 0.2s ease',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Tutup"
          title="Tutup (Esc)"
        >
          ×
        </button>

        {/* Main image */}
        <Image
          src={currentPhotoSrc}
          alt={`Foto ${source === 'popup' ? 'feature' : 'irigasi'} ${currentPhotoIndex + 1}`}
          width={1920}
          height={1080}
          unoptimized
          style={{
            maxWidth: 'calc(100vw - 160px)',
            maxHeight: 'calc(100vh - 160px)',
            width: 'auto',
            height: 'auto',
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            cursor: 'default',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const failedUrl = img.src;
            if (onPhotoError) {
              onPhotoError(failedUrl);
            }
            // Try next photo if current one fails
            if (hasMultiplePhotos) {
              const nextIndex = (currentPhotoIndex + 1) % photos.length;
              if (nextIndex !== currentPhotoIndex) {
                setTimeout(() => {
                  onGoToPhoto(nextIndex);
                }, 100);
              }
            }
          }}
        />

        {/* Navigation controls (only show if multiple photos) */}
        {hasMultiplePhotos && (
          <>
            {/* Previous button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              style={{
                position: 'absolute',
                left: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 600,
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 10,
                transition: 'background 0.2s ease, transform 0.2s ease',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
              aria-label="Foto sebelumnya"
              title="Foto sebelumnya (←)"
            >
              ‹
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 600,
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 10,
                transition: 'background 0.2s ease, transform 0.2s ease',
                pointerEvents: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
              aria-label="Foto berikutnya"
              title="Foto berikutnya (→)"
            >
              ›
            </button>

            {/* Photo indicators (dots) */}
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 20,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 10,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToPhoto(idx);
                  }}
                  style={{
                    width: idx === currentPhotoIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: 'none',
                    background: idx === currentPhotoIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'width 0.2s ease, background 0.2s ease',
                  }}
                  aria-label={`Foto ${idx + 1}`}
                />
              ))}
            </div>

            {/* Photo counter */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                borderRadius: 16,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 500,
                zIndex: 10,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {currentPhotoIndex + 1} / {photos.length}
            </div>

            {/* Source badge (for debugging/clarity) */}
            {source && (
              <div
                style={{
                  position: 'absolute',
                  top: 60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: 'rgba(10, 132, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                  zIndex: 10,
                  pointerEvents: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {source === 'popup' ? 'Feature Popup' : 'Card Slider'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
