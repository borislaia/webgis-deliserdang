"use client";
import styles from './DarkGridBg.module.css';

export default function DarkGridBg() {
    // Generate horizontal wavy lines
    const horizontalLines = [];
    for (let i = 0; i < 30; i++) {
        const y = (i * 30) + 20;
        const offset = (i % 3) * 30;
        horizontalLines.push(
            <path
                key={`h-${i}`}
                className={styles.horizontalWave}
                d={`M0,${y} Q360,${y - offset} 720,${y} T1440,${y}`}
                style={{ animationDelay: `${i * 0.1}s` }}
            />
        );
    }

    // Generate vertical wavy lines
    const verticalLines = [];
    for (let i = 0; i < 50; i++) {
        const x = i * 30;
        const offset = (i % 3) * 30;
        verticalLines.push(
            <path
                key={`v-${i}`}
                className={styles.verticalWave}
                d={`M${x},0 Q${x - offset},200 ${x},400 T${x},800`}
                style={{ animationDelay: `${i * 0.08}s` }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <svg className={styles.waveSvg} viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
                {/* Horizontal wavy lines */}
                {horizontalLines}
                {/* Vertical wavy lines */}
                {verticalLines}
            </svg>
        </div>
    );
}
