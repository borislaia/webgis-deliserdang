import styles from './LoadingSkeletons.module.css';

/**
 * Loading Skeleton Components
 * 
 * Provides visual feedback during page loads to improve perceived performance
 */

// Progress Bar Component
export function ProgressBar({ progress = 0 }: { progress?: number }) {
    return (
        <div className={styles.progressBar}>
            <div
                className={styles.progressBarFill}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
    );
}

// Spinner Component
export function Spinner({ size = 'normal' }: { size?: 'normal' | 'large' }) {
    return (
        <div className={`${styles.spinner} ${size === 'large' ? styles.spinnerLarge : ''}`} />
    );
}

// Loading Message Component
export function LoadingMessage({
    message = 'Memuat data...',
    showSpinner = true
}: {
    message?: string;
    showSpinner?: boolean;
}) {
    return (
        <div className={styles.loadingMessage}>
            {showSpinner && <Spinner size="large" />}
            <p>{message}</p>
        </div>
    );
}

// Daerah Irigasi Page Loading Skeleton
export function DaerahIrigasiSkeleton() {
    return (
        <div className={styles.loadingContainer}>
            {/* Sidebar Skeleton */}
            <div className={styles.loadingSidebar}>
                <div className={`${styles.skeleton} ${styles.loadingSidebarHeader}`} />
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`${styles.skeleton} ${styles.loadingSidebarItem}`} />
                ))}
            </div>

            {/* Content Skeleton */}
            <div className={styles.loadingContent}>
                {/* Header */}
                <div className={`${styles.skeleton} ${styles.loadingHeader}`} />

                {/* Stats Cards */}
                <div className={styles.loadingStats}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`${styles.skeleton} ${styles.loadingStatCard}`} />
                    ))}
                </div>

                {/* Gallery */}
                <div className={styles.loadingGallery}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`${styles.skeleton} ${styles.loadingImage}`} />
                    ))}
                </div>

                {/* Documents */}
                <div className={styles.loadingDocuments}>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`${styles.skeleton} ${styles.loadingDocument}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Map Loading Skeleton
export function MapLoadingSkeleton({ message = 'Memuat peta...' }: { message?: string }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg)'
        }}>
            <LoadingMessage message={message} />
        </div>
    );
}

// Generic Card Skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className={styles.skeleton}
                    style={{
                        height: '200px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}
                />
            ))}
        </>
    );
}

// List Item Skeleton
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className={styles.skeleton}
                    style={{
                        height: '48px',
                        borderRadius: '8px',
                        marginBottom: '8px'
                    }}
                />
            ))}
        </>
    );
}

// Image Gallery Skeleton
export function ImageGallerySkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className={styles.loadingGallery}>
            {[...Array(count)].map((_, i) => (
                <div key={i} className={`${styles.skeleton} ${styles.loadingImage}`} />
            ))}
        </div>
    );
}
