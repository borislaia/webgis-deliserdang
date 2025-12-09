"use client";
import { useEffect, useRef } from 'react';
import styles from './DotPatternBg.module.css';

export default function DotPatternBg() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            container.style.setProperty('--offset-x', `${x}px`);
            container.style.setProperty('--offset-y', `${y}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className={styles.container}>
            <div className={styles.dotPattern} />
            <div className={styles.gradientOverlay}>
                <div className={styles.orb1} />
                <div className={styles.orb2} />
                <div className={styles.orb3} />
            </div>
        </div>
    );
}
