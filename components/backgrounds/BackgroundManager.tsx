"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import VantaFog from '../VantaFog';
import ModernGradientBg from './ModernGradientBg';
import GridPatternBg from './GridPatternBg';
import MeshGradientBg from './MeshGradientBg';
import DotPatternBg from './DotPatternBg';
import WavePatternBg from './WavePatternBg';

export type BackgroundType = 'vanta' | 'gradient' | 'grid' | 'mesh' | 'dots' | 'wave' | 'none';

interface BackgroundManagerProps {
    defaultBackground?: BackgroundType;
    allowSwitch?: boolean;
}

export default function BackgroundManager({
    defaultBackground = 'gradient',
    allowSwitch = true
}: BackgroundManagerProps) {
    const pathname = usePathname();
    const [currentBg, setCurrentBg] = useState<BackgroundType>(defaultBackground);

    // Don't show background on map page
    if (pathname?.startsWith('/map')) {
        return null;
    }

    // Load saved preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred-background') as BackgroundType;
            if (saved && allowSwitch) {
                setCurrentBg(saved);
            }
        }
    }, [allowSwitch]);

    const handleBackgroundChange = (bg: BackgroundType) => {
        setCurrentBg(bg);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred-background', bg);
        }
    };

    const renderBackground = () => {
        switch (currentBg) {
            case 'vanta':
                return <VantaFog />;
            case 'gradient':
                return <ModernGradientBg />;
            case 'grid':
                return <GridPatternBg />;
            case 'mesh':
                return <MeshGradientBg />;
            case 'dots':
                return <DotPatternBg />;
            case 'wave':
                return <WavePatternBg />;
            case 'none':
                return null;
            default:
                return <ModernGradientBg />;
        }
    };

    return (
        <>
            {renderBackground()}

            {allowSwitch && (
                <div style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 100,
                    display: 'flex',
                    gap: 8,
                    padding: 12,
                    background: 'var(--card)',
                    border: '1px solid var(--stroke)',
                    borderRadius: 16,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                }}>
                    <BackgroundButton
                        active={currentBg === 'gradient'}
                        onClick={() => handleBackgroundChange('gradient')}
                        title="Gradient"
                        emoji="🌈"
                    />
                    <BackgroundButton
                        active={currentBg === 'grid'}
                        onClick={() => handleBackgroundChange('grid')}
                        title="Grid"
                        emoji="⚡"
                    />
                    <BackgroundButton
                        active={currentBg === 'mesh'}
                        onClick={() => handleBackgroundChange('mesh')}
                        title="Mesh"
                        emoji="✨"
                    />
                    <BackgroundButton
                        active={currentBg === 'dots'}
                        onClick={() => handleBackgroundChange('dots')}
                        title="Dots"
                        emoji="🔵"
                    />
                    <BackgroundButton
                        active={currentBg === 'wave'}
                        onClick={() => handleBackgroundChange('wave')}
                        title="Wave"
                        emoji="🌊"
                    />
                    <BackgroundButton
                        active={currentBg === 'vanta'}
                        onClick={() => handleBackgroundChange('vanta')}
                        title="Vanta (3D)"
                        emoji="🌫️"
                    />
                    <BackgroundButton
                        active={currentBg === 'none'}
                        onClick={() => handleBackgroundChange('none')}
                        title="None"
                        emoji="⬜"
                    />
                </div>
            )}
        </>
    );
}

function BackgroundButton({
    active,
    onClick,
    title,
    emoji
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    emoji: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: active ? '2px solid var(--brand)' : '1px solid var(--stroke)',
                background: active ? 'var(--brand)' : '#fff',
                color: active ? '#fff' : 'var(--text)',
                fontSize: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 4px 12px rgba(10,132,255,0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
        >
            {emoji}
        </button>
    );
}
