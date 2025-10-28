/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yyagythhwzdncantoszf.supabase.co'
      }
    ]
  },
  async rewrites() {
    return [
      { source: '/index.html', destination: '/' },
      { source: '/login.html', destination: '/login' },
      { source: '/map.html', destination: '/map' },
      { source: '/dashboard.html', destination: '/' },
      { source: '/irrigation-management.html', destination: '/' }
    ]
  }
};

export default nextConfig;
