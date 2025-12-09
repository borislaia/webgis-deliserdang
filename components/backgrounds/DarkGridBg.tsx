"use client";
import styles from './DarkGridBg.module.css';

export default function DarkGridBg() {
    return (
        <div className={styles.container}>
            <div className={styles.gridPattern} />
            <div className={styles.gradientOverlay} />
            <div className={styles.glow1} />
            <div className={styles.glow2} />
        </div>
    );
}
