"use client";
import { useEffect, useRef } from 'react';
import styles from './WavePatternBg.module.css';

export default function WavePatternBg() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        const drawWave = (
            yOffset: number,
            amplitude: number,
            frequency: number,
            phase: number,
            color: string,
            opacity: number
        ) => {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width; x += 2) {
                const y = yOffset + Math.sin((x * frequency + phase) * 0.01) * amplitude;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();

            ctx.fillStyle = color.replace('OPACITY', opacity.toString());
            ctx.fill();
        };

        const animate = () => {
            time += 0.01;

            // Clear canvas with gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#fafafa');
            gradient.addColorStop(1, '#e0e7ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw multiple waves
            drawWave(
                canvas.height * 0.7,
                60,
                0.8,
                time * 30,
                'rgba(99, 102, 241, OPACITY)',
                0.15
            );
            drawWave(
                canvas.height * 0.75,
                50,
                1.0,
                time * 25,
                'rgba(168, 85, 247, OPACITY)',
                0.12
            );
            drawWave(
                canvas.height * 0.8,
                70,
                0.6,
                time * 20,
                'rgba(59, 130, 246, OPACITY)',
                0.18
            );
            drawWave(
                canvas.height * 0.85,
                40,
                1.2,
                time * 35,
                'rgba(14, 165, 233, OPACITY)',
                0.1
            );

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className={styles.container}>
            <canvas ref={canvasRef} className={styles.canvas} />
            <div className={styles.overlay} />
        </div>
    );
}
