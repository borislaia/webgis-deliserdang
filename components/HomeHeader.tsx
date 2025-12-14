"use client";
import Image from 'next/image';
import DashboardButton from '@/components/DashboardButton';

interface HomeHeaderProps {
    tenantUptd?: string;
}

export default function HomeHeader({ tenantUptd }: HomeHeaderProps) {
    return (
        <header className="app-header blur">
            <div className="brand">
                <Image src="/assets/icons/logo-deliserdang.png" alt="Logo" width={24} height={24} className="brand-icon" />
                <span className="brand-text">
                    WebGIS Deli Serdang {tenantUptd ? `UPTD ${tenantUptd}` : ''}
                </span>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DashboardButton />
            </nav>
        </header>
    );
}
