import { useState, useEffect, useRef } from 'react';
import styles from './InputModal.module.css';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    type?: 'primary' | 'warning' | 'info';
}

export default function InputModal({
    isOpen,
    title,
    message,
    placeholder = '',
    defaultValue = '',
    confirmText = 'Simpan',
    cancelText = 'Batal',
    onConfirm,
    onCancel,
    type = 'primary'
}: InputModalProps) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Focus and select all text when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={`${styles.header} ${styles[type]}`}>
                    <span className={styles.icon}>
                        {type === 'primary' && '✏️'}
                        {type === 'warning' && '⚠️'}
                        {type === 'info' && 'ℹ️'}
                    </span>
                    <h3>{title}</h3>
                </div>

                <div className={styles.body}>
                    {message && <p className={styles.message}>{message}</p>}
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`${styles.confirmBtn} ${styles[type]}`}
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
