"use client";
import { TenantProvider } from '@/lib/tenant-context';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <TenantProvider>
            {children}
        </TenantProvider>
    );
}
