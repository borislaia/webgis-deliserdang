"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import VantaFog from '../VantaFog';
import ModernGradientBg from './ModernGradientBg';
import GridPatternBg from './GridPatternBg';
import DarkGradientBg from './DarkGradientBg';
import DarkGridBg from './DarkGridBg';
import WavePatternBg from './WavePatternBg';

export type BackgroundType = 'vanta' | 'gradient' | 'grid' | 'dark-gradient' | 'dark-grid' | 'wave' | 'none';

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
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

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
            case 'dark-gradient':
                return <DarkGradientBg />;
            case 'dark-grid':
                return <DarkGridBg />;
            case 'wave':
                return <WavePatternBg />;
            case 'none':
                return null;
            default:
                return <ModernGradientBg />;
        }
    };

    // Don't show background on map and register pages - moved after hooks
    // Login page will show background for better aesthetics
    if (pathname?.startsWith('/map') || pathname?.startsWith('/register')) {
        return null;
    }

    // Show switcher on home and login pages
    const showSwitcher = allowSwitch && (pathname === '/' || pathname === '/login');

    return (
        <>
            {renderBackground()}

            {showSwitcher && (
                <div style={{
                    position: 'fixed',
                    bottom: 10,
                    right: 10,
                    zIndex: 100,
                    display: 'flex',
                    gap: 4,
                    padding: 6,
                    background: 'var(--card)',
                    border: '1px solid var(--stroke)',
                    borderRadius: 8,
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                }}>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: '1px solid var(--stroke)',
                            background: theme === 'dark' ? '#333' : '#fff',
                            color: theme === 'dark' ? '#fff' : 'var(--text)',
                            fontSize: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    {/* Separator */}
                    <div style={{ width: 1, background: 'var(--stroke)', margin: '0 2px' }} />

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
                        active={currentBg === 'dark-gradient'}
                        onClick={() => handleBackgroundChange('dark-gradient')}
                        title="Dark Gradient"
                        emoji="🌙"
                    />
                    <BackgroundButton
                        active={currentBg === 'dark-grid'}
                        onClick={() => handleBackgroundChange('dark-grid')}
                        title="Dark Grid"
                        emoji="🌑"
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
                width: 22,
                height: 22,
                borderRadius: 6,
                border: active ? '1px solid var(--brand)' : '1px solid var(--stroke)',
                background: active ? 'var(--brand)' : '#fff',
                color: active ? '#fff' : 'var(--text)',
                fontSize: 10,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 2px 6px rgba(10,132,255,0.3)' : 'none',
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
