"use client";
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './IrrigationManagementView.module.css';

interface StorageManagerProps {
    bucketName: string;
    folderPath: string; // e.g. "12120008"
    acceptedTypes: string; // e.g. "image/*" or ".pdf"
    viewMode?: 'grid' | 'list';
    onFileUploaded?: () => void;
}

interface FileItem {
    name: string;
    id: string | null;
    updated_at: string;
    last_accessed_at: string | null;
    metadata: Record<string, any> | null;
}

export default function StorageManager({ bucketName, folderPath, acceptedTypes, viewMode = 'grid', onFileUploaded }: StorageManagerProps) {
    const supabase = createClient();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage.from(bucketName).list(folderPath, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' },
            });
            if (error) throw error;
            setFiles(data || []);
        } catch (e) {
            console.error('Error fetching files:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bucketName, folderPath]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        setUploading(true);
        try {
            // Parallel uploads
            const uploads = Array.from(fileList).map(async (file) => {
                const path = `${folderPath}/${file.name}`;
                const { error } = await supabase.storage.from(bucketName).upload(path, file, {
                    upsert: true,
                });
                if (error) throw error;
            });

            await Promise.all(uploads);
            fetchFiles();
            if (onFileUploaded) onFileUploaded();
        } catch (e: any) {
            alert(`Upload gagal: ${e.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Hapus file ${fileName}?`)) return;
        try {
            const { error } = await supabase.storage.from(bucketName).remove([`${folderPath}/${fileName}`]);
            if (error) throw error;
            setFiles(prev => prev.filter(f => f.name !== fileName));
        } catch (e: any) {
            alert(`Gagal menghapus: ${e.message}`);
        }
    };

    const handleRename = async (oldName: string) => {
        const newName = prompt("Rename file to:", oldName);
        if (!newName || newName === oldName) return;

        // Ensure extension is preserved or user handles it? 
        // Usually user might mess it up, but for now simple rename
        try {
            const { error } = await supabase.storage
                .from(bucketName)
                .move(`${folderPath}/${oldName}`, `${folderPath}/${newName}`);

            if (error) throw error;
            fetchFiles();
        } catch (e: any) {
            alert(`Gagal rename: ${e.message}`);
        }
    };

    const getPublicUrl = (fileName: string) => {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}/${fileName}`);
        return data.publicUrl;
    };

    return (
        <div>
            <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    multiple
                    accept={acceptedTypes}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                />
                <p>{uploading ? 'Mengupload...' : 'Klik atau Tarik file ke sini untuk mengupload (Timpa file yang bernama sama)'}</p>
            </div>

            {loading && <div style={{ padding: 20, textAlign: 'center' }}>Loading files...</div>}

            <div className={styles.fileGrid}>
                {files.map((file) => {
                    if (file.name === '.emptyFolderPlaceholder') return null;
                    const url = getPublicUrl(file.name);
                    const isImage = file.metadata?.mimetype?.startsWith('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

                    return (
                        <div key={file.name} className={styles.fileCard}>
                            <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4, zIndex: 10 }}>
                                <a href={url} download={file.name} target="_blank" rel="noopener noreferrer" className={styles.iconBtn} title="Download">
                                    ⬇️
                                </a>
                                <button
                                    className={styles.iconBtn}
                                    onClick={(e) => { e.stopPropagation(); handleRename(file.name); }}
                                    title="Rename"
                                >
                                    ✏️
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                                    title="Hapus"
                                >
                                    &times;
                                </button>
                            </div>

                            {isImage ? (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
                                    <img src={url} alt={file.name} className={styles.fileThumb} />
                                </div>
                            ) : (
                                <div className={styles.filePdf}>
                                    <div style={{ fontSize: 24 }}>📄</div>
                                </div>
                            )}

                            <div className={styles.fileInfo}>
                                <div style={{ fontWeight: 600 }}>{file.name}</div>
                                <div style={{ fontSize: '0.9em', opacity: 0.8 }}>{(file.metadata?.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
