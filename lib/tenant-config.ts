
// Mapping Domain -> UPTD Value
// Format: 'domain.com': 'UPTD_VALUE'
export const DOMAIN_MAPPING: Record<string, string> = {
    // Production mappings (Custom Domains) - NEW PURCHASED DOMAINS
    'webgis-di-uptd1-deli-serdang.com': 'I',
    'webgis-di-uptd5-deli-serdang.com': 'V',
    'webgis-di-uptd6-deli-serdang.com': 'VI',

    // With www prefix
    'www.webgis-di-uptd1-deli-serdang.com': 'I',
    'www.webgis-di-uptd5-deli-serdang.com': 'V',
    'www.webgis-di-uptd6-deli-serdang.com': 'VI',

    // Vercel Free Domains (.vercel.app) - Optional fallback
    'webgis-di-uptd1-deli-serdang.vercel.app': 'I',
    'webgis-di-uptd5-deli-serdang.vercel.app': 'V',
    'webgis-di-uptd6-deli-serdang.vercel.app': 'VI',

    // Localhost / Development
    'localhost:3000': 'I',
    'localhost:3001': 'I',
    'localhost:3002': 'I',
    '127.0.0.1:3000': 'I',
};

export const DEFAULT_UPTD = 'I'; // Fallback if no domain matches

/**
 * Get UPTD value based on hostname
 */
export function getTenantFromHostname(hostname: string): string {
    // Clean hostname (remove port if exists)
    const host = hostname.split(':')[0]; // e.g. localhost

    // 1. Direct Match (including port if in key)
    if (DOMAIN_MAPPING[hostname]) return DOMAIN_MAPPING[hostname];

    // 2. Host Match
    if (DOMAIN_MAPPING[host]) return DOMAIN_MAPPING[host];

    // 3. Regex/Partial Match (Optional - customize as needed)
    if (hostname.includes('wilayah5')) return 'V';
    if (hostname.includes('wilayah6')) return 'VI';

    return DEFAULT_UPTD;
}
