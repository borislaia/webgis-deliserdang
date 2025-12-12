"use client";
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './IrrigationManagementView.module.css';
import Toast, { ToastType } from './Toast';
import ConfirmModal from './ConfirmModal';
import InputModal from './InputModal';

interface StorageManagerProps {
    bucketName: string;
    folderPath: string; // e.g. "12120008"
    acceptedTypes: string; // e.g. "image/*" or ".pdf"
    viewMode?: 'grid' | 'list';
    onFileUploaded?: () => void;
    readOnly?: boolean;
}

interface FileItem {
    name: string;
    id: string | null;
    updated_at: string;
    last_accessed_at: string | null;
    metadata: Record<string, any> | null;
}

export default function StorageManager({ bucketName, folderPath, acceptedTypes, viewMode = 'grid', onFileUploaded, readOnly = false }: StorageManagerProps) {
    const supabase = createClient();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        fileName: string;
    }>({
        isOpen: false,
        fileName: ''
    });

    // Rename modal state
    const [renameModal, setRenameModal] = useState<{
        isOpen: boolean;
        fileName: string;
    }>({
        isOpen: false,
        fileName: ''
    });

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

    useEffect(() => {
        console.log('📋 StorageManager Props:', {
            bucketName,
            folderPath,
            readOnly,
            acceptedTypes
        });
    }, [bucketName, folderPath, readOnly, acceptedTypes]);

    const uploadFiles = async (fileList: FileList) => {
        if (!fileList || fileList.length === 0) return;

        setUploading(true);
        try {
            const fileCount = fileList.length;
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

            // Show success toast
            const message = fileCount === 1
                ? 'File berhasil diupload'
                : `${fileCount} file berhasil diupload`;
            setToast({ message, type: 'success' });
        } catch (e: any) {
            setToast({ message: `Upload gagal: ${e.message}`, type: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList) await uploadFiles(fileList);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const fileList = e.dataTransfer.files;
        if (fileList) await uploadFiles(fileList);
    };

    const handleDelete = (fileName: string) => {
        console.log('🔴 handleDelete CALLED for:', fileName);
        setConfirmModal({
            isOpen: true,
            fileName
        });
    };

    const executeDelete = async () => {
        const fileName = confirmModal.fileName;
        setConfirmModal({ isOpen: false, fileName: '' });

        const fullPath = `${folderPath}/${fileName}`;
        console.log('=== DELETE DEBUG ===');
        console.log('Bucket:', bucketName);
        console.log('Folder Path:', folderPath);
        console.log('File Name:', fileName);
        console.log('Full Path:', fullPath);

        try {
            console.log('Calling API route /api/delete-file...');

            const response = await fetch('/api/delete-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bucketName,
                    filePath: fullPath
                })
            });

            const result = await response.json();
            console.log('API Response:', JSON.stringify(result, null, 2));

            if (!result.success) {
                console.error('Delete failed with error:', result.error);
                throw new Error(result.error || 'Unknown error');
            }

            console.log('Delete successful, updating UI...');
            setFiles(prev => prev.filter(f => f.name !== fileName));
            setToast({ message: 'File berhasil dihapus', type: 'success' });

            // Refresh file list to ensure UI is in sync
            await fetchFiles();
        } catch (e: any) {
            console.error('=== DELETE ERROR ===');
            console.error('Error type:', typeof e);
            console.error('Error message:', e.message);
            console.error('Full error:', e);
            setToast({ message: `Gagal menghapus: ${e.message}`, type: 'error' });
        }
    };

    const handleRename = (fileName: string) => {
        setRenameModal({
            isOpen: true,
            fileName
        });
    };

    const executeRename = async (newName: string) => {
        const oldName = renameModal.fileName;
        setRenameModal({ isOpen: false, fileName: '' });

        if (!newName || newName === oldName) return;

        try {
            const { error } = await supabase.storage
                .from(bucketName)
                .move(`${folderPath}/${oldName}`, `${folderPath}/${newName}`);

            if (error) throw error;
            fetchFiles();
            setToast({ message: 'File berhasil direname', type: 'success' });
        } catch (e: any) {
            setToast({ message: `Gagal rename: ${e.message}`, type: 'error' });
        }
    };

    const getPublicUrl = (fileName: string) => {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(`${folderPath}/${fileName}`);
        return data.publicUrl;
    };

    return (
        <div>
            {!readOnly && (
                <div
                    className={styles.dropzone}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        borderColor: isDragging ? '#4CAF50' : undefined,
                        backgroundColor: isDragging ? 'rgba(76, 175, 80, 0.1)' : undefined,
                    }}
                >
                    <input
                        type="file"
                        multiple
                        accept={acceptedTypes}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                    />
                    <p>{uploading ? 'Mengupload...' : isDragging ? '📂 Lepaskan file di sini' : 'Klik atau Tarik file ke sini untuk mengupload (Timpa file yang bernama sama)'}</p>
                </div>
            )}

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
                                {!readOnly && (
                                    <>
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
                                    </>
                                )}
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

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Hapus File"
                message={`Apakah Anda yakin ingin menghapus file "${confirmModal.fileName}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
                onConfirm={executeDelete}
                onCancel={() => setConfirmModal({ isOpen: false, fileName: '' })}
            />

            {/* Rename Modal */}
            <InputModal
                isOpen={renameModal.isOpen}
                title="Rename File"
                message="Masukkan nama baru untuk file ini:"
                placeholder="Nama file baru"
                defaultValue={renameModal.fileName}
                confirmText="Rename"
                cancelText="Batal"
                type="primary"
                onConfirm={executeRename}
                onCancel={() => setRenameModal({ isOpen: false, fileName: '' })}
            />
        </div>
    );
}
