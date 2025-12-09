"use client";
import styles from './GridPatternBg.module.css';

export default function GridPatternBg() {
    return (
        <div className={styles.container}>
            <div className={styles.gridPattern} />
            <div className={styles.gradientOverlay} />
            <div className={styles.spotlights}>
                <div className={styles.spotlight} style={{ top: '20%', left: '30%' }} />
                <div className={styles.spotlight} style={{ top: '60%', left: '70%' }} />
                <div className={styles.spotlight} style={{ top: '40%', left: '50%' }} />
            </div>
        </div>
    );
}
