/** @type {import('next').NextConfig} */
// Extract hostname from Supabase URL or use fallback
const getSupabaseHostname = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      return new URL(supabaseUrl).hostname
    } catch {
      // Invalid URL, use fallback
    }
  }
  // Fallback for backward compatibility
  return 'yyagythhwzdncantoszf.supabase.co'
}

const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname()
      }
    ]
  },
  async rewrites() {
    return [
      { source: '/index.html', destination: '/' },
      { source: '/login.html', destination: '/login' },
      { source: '/map.html', destination: '/map' },
      { source: '/dashboard.html', destination: '/dashboard' }
    ]
  }
};

export default nextConfig;
