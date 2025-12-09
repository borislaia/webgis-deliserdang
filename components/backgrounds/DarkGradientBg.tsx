"use client";
import styles from './DarkGradientBg.module.css';

export default function DarkGradientBg() {
    return (
        <div className={styles.container}>
            <div className={styles.gradientLayer1} />
            <div className={styles.gradientLayer2} />
            <div className={styles.gradientLayer3} />
            <div className={styles.noise} />
        </div>
    );
}
