"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './DaerahIrigasiView.module.css';

type DI = {
    k_di: string;
    n_di?: string | null;
    kecamatan?: string | null;
};

type SelectedDI = {
    k_di: string;
    n_di?: string | null;
    luas_ha?: number | null;
    kecamatan?: string | null;
    desa_kel?: string | null;
    sumber_air?: string | null;
    tahun_data?: number | null;
};

type PDF = {
    name: string;
    url: string;
};

type Props = {
    allDI: DI[];
    selectedDI: SelectedDI | null;
    selectedKDI: string;
    images: string[];
    pdfs: PDF[];
};

export default function DaerahIrigasiView({ allDI: initialAllDI, selectedDI: initialSelectedDI, selectedKDI: initialKDI, images: initialImages, pdfs: initialPdfs }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [allDI] = useState<DI[]>(initialAllDI);
    const [selectedKDI, setSelectedKDI] = useState(initialKDI);
    const [selectedDI, setSelectedDI] = useState<SelectedDI | null>(initialSelectedDI);
    const [images, setImages] = useState<string[]>(initialImages);
    const [pdfs, setPdfs] = useState<PDF[]>(initialPdfs);
    const [loading, setLoading] = useState(false);

    // Filter DI based on search
    const filteredDI = allDI.filter((di) => {
        const query = searchQuery.toLowerCase();
        return (
            di.k_di.toLowerCase().includes(query) ||
            (di.n_di && di.n_di.toLowerCase().includes(query)) ||
            (di.kecamatan && di.kecamatan.toLowerCase().includes(query))
        );
    });

    // Handle DI selection - NO NAVIGATION, just update state
    const handleDIClick = async (k_di: string) => {
        if (k_di === selectedKDI) return; // Already selected

        setLoading(true);
        setSelectedKDI(k_di);

        // Update URL without navigation
        window.history.pushState({}, '', `/daerah-irigasi/${k_di}`);

        try {
            // Fetch data for selected DI in parallel
            const [
                { data: diData },
                imageFilesResult,
                pdfFilesResult
            ] = await Promise.all([
                supabase
                    .from('daerah_irigasi')
                    .select('*')
                    .eq('k_di', k_di)
                    .maybeSingle(),

                supabase.storage
                    .from('images')
                    .list(`${k_di}/citra`, {
                        limit: 100,
                        sortBy: { column: 'name', order: 'asc' },
                    })
                    .catch(() => ({ data: null, error: null })),

                supabase.storage
                    .from('pdf')
                    .list(k_di, {
                        limit: 100,
                        sortBy: { column: 'name', order: 'asc' },
                    })
                    .catch(() => ({ data: null, error: null }))
            ]);

            setSelectedDI(diData);

            // Process images
            let newImages: string[] = [];
            if (imageFilesResult.data) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
                newImages = imageFilesResult.data
                    .filter((file) => {
                        const name = (file.name || '').toLowerCase();
                        return imageExtensions.some((ext) => name.endsWith(ext));
                    })
                    .map((file) => {
                        const { data } = supabase.storage
                            .from('images')
                            .getPublicUrl(`${k_di}/citra/${file.name}`);
                        return data.publicUrl;
                    });
            }
            setImages(newImages);

            // Process PDFs
            let newPdfs: PDF[] = [];
            if (pdfFilesResult.data) {
                newPdfs = pdfFilesResult.data
                    .filter((file) => {
                        const name = (file.name || '').toLowerCase();
                        return name.endsWith('.pdf');
                    })
                    .map((file) => {
                        const { data } = supabase.storage
                            .from('pdf')
                            .getPublicUrl(`${k_di}/${file.name}`);
                        return {
                            name: file.name,
                            url: data.publicUrl,
                        };
                    });
            }
            setPdfs(newPdfs);

        } catch (error) {
            console.error('Error loading DI data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.brand}>
                    <Image
                        src="/assets/icons/logo-deliserdang.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className={styles.brandIcon}
                    />
                    <span className={styles.brandText}>Daerah Irigasi - Deli Serdang</span>
                </div>
                <Link href="/" className={styles.homeButton}>
                    Kembali ke Home
                </Link>
            </header>

            <div className={styles.mainContent}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Cari Nama atau Kode DI..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.diList}>
                        {filteredDI.map((di) => (
                            <button
                                key={di.k_di}
                                onClick={() => handleDIClick(di.k_di)}
                                className={`${styles.diItem} ${di.k_di === selectedKDI ? styles.active : ''}`}
                                disabled={loading && di.k_di !== selectedKDI}
                            >
                                <div className={styles.itemTitle}>{di.n_di || di.k_di}</div>
                                <div className={styles.itemSubtitle}>
                                    <span>{di.k_di}</span>
                                    <span>{di.kecamatan || '-'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Content Area */}
                <main className={styles.content}>
                    {loading ? (
                        <div className={styles.emptyState}>
                            <p>Memuat data...</p>
                        </div>
                    ) : !selectedDI ? (
                        <div className={styles.emptyState}>
                            <p>Data tidak ditemukan untuk kode DI: {selectedKDI}</p>
                        </div>
                    ) : (
                        <>
                            {/* DI Info Header */}
                            <div className={styles.diHeader}>
                                <h1 className={styles.diTitle}>
                                    {selectedDI.n_di || selectedDI.k_di}
                                </h1>
                                <Link
                                    href={`/map?di=${encodeURIComponent(selectedDI.k_di)}`}
                                    className={styles.mapButton}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="white"
                                        style={{ marginRight: '6px' }}
                                    >
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    LIHAT PETA
                                </Link>
                            </div>

                            {/* Galeri Foto */}
                            {images.length > 0 && (
                                <section className={styles.section}>
                                    <div className={styles.imageList}>
                                        {images.map((imageUrl, index) => (
                                            <div key={index} className={styles.imageWrapper}>
                                                <img
                                                    src={imageUrl}
                                                    alt={`Foto ${index + 1}`}
                                                    className={styles.image}
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Dokumen / Skema */}
                            {pdfs.length > 0 && (
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>Dokumen / Skema</h2>
                                    <div className={styles.pdfList}>
                                        {pdfs.map((pdf, index) => (
                                            <div key={index} className={styles.pdfItem}>
                                                <div className={styles.pdfInfo}>
                                                    <div className={styles.pdfIcon}>📄</div>
                                                    <div className={styles.pdfName}>{pdf.name}</div>
                                                </div>
                                                <div className={styles.pdfActions}>
                                                    <a
                                                        href={pdf.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.pdfButton}
                                                    >
                                                        Lihat PDF
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {images.length === 0 && pdfs.length === 0 && (
                                <div className={styles.emptyState}>
                                    <p>Belum ada foto atau dokumen untuk DI ini.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
