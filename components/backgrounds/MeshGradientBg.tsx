"use client";
import { useEffect, useRef } from 'react';
import styles from './MeshGradientBg.module.css';

export default function MeshGradientBg() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;

            container.style.setProperty('--mouse-x', `${x}%`);
            container.style.setProperty('--mouse-y', `${y}%`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className={styles.container}>
            <div className={styles.mesh}>
                <div className={styles.gradient1} />
                <div className={styles.gradient2} />
                <div className={styles.gradient3} />
                <div className={styles.gradient4} />
                <div className={styles.gradient5} />
            </div>
            <div className={styles.noise} />
        </div>
    );
}
