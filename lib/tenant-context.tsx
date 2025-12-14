'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

type TenantContextType = {
    tenant: string | undefined;
    isLoading: boolean;
};

const TenantContext = createContext<TenantContextType>({ tenant: undefined, isLoading: true });

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenant, setTenant] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Read tenant from cookie on mount
        const cookieValue = Cookies.get('tenant_uptd');
        setTenant(cookieValue);
        setIsLoading(false);
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    return context;
}
