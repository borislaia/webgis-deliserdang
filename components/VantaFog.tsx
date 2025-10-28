"use client";
import { useEffect, useRef } from 'react';

export default function VantaFog() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const vantaRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const THREE = await import('three');
        const VANTA = await import('vanta/dist/vanta.fog.min');
        if (cancelled || !elRef.current) return;
        vantaRef.current = VANTA.default({
          el: elRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0xffffff,
          midtoneColor: 0x00f2ff,
          lowlightColor: 0xd9d9d9,
          baseColor: 0xffffff,
          blurFactor: 0.57,
          speed: 1.6,
          zoom: 0.8,
        });
      } catch (e) {
        // Fallback background if Vanta fails
        if (elRef.current) {
          elRef.current.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
      }
    })();
    return () => {
      cancelled = true;
      try { vantaRef.current?.destroy?.(); } catch {}
    };
  }, []);

  return <div id="vanta-bg" ref={elRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 as any }} />;
}
