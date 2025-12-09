"use client";
import { useEffect, useRef } from 'react';
import styles from './ModernGradientBg.module.css';

export default function ModernGradientBg() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        // Animated gradient blobs
        const blobs: Array<{
            x: number;
            y: number;
            radius: number;
            color: string;
            vx: number;
            vy: number;
        }> = [
                {
                    x: canvas.width * 0.2,
                    y: canvas.height * 0.3,
                    radius: 300,
                    color: 'rgba(99, 102, 241, 0.3)', // indigo
                    vx: 0.3,
                    vy: 0.2,
                },
                {
                    x: canvas.width * 0.8,
                    y: canvas.height * 0.7,
                    radius: 350,
                    color: 'rgba(168, 85, 247, 0.25)', // purple
                    vx: -0.2,
                    vy: 0.3,
                },
                {
                    x: canvas.width * 0.5,
                    y: canvas.height * 0.5,
                    radius: 280,
                    color: 'rgba(59, 130, 246, 0.28)', // blue
                    vx: 0.25,
                    vy: -0.25,
                },
                {
                    x: canvas.width * 0.7,
                    y: canvas.height * 0.2,
                    radius: 320,
                    color: 'rgba(14, 165, 233, 0.22)', // sky
                    vx: -0.28,
                    vy: 0.18,
                },
            ];

        let animationId: number;

        const animate = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw blobs
            blobs.forEach((blob) => {
                // Update position
                blob.x += blob.vx;
                blob.y += blob.vy;

                // Bounce off edges
                if (blob.x - blob.radius < 0 || blob.x + blob.radius > canvas.width) {
                    blob.vx *= -1;
                }
                if (blob.y - blob.radius < 0 || blob.y + blob.radius > canvas.height) {
                    blob.vy *= -1;
                }

                // Draw blob with radial gradient
                const gradient = ctx.createRadialGradient(
                    blob.x,
                    blob.y,
                    0,
                    blob.x,
                    blob.y,
                    blob.radius
                );
                gradient.addColorStop(0, blob.color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

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
