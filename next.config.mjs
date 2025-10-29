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
      { source: '/dashboard.html', destination: '/dashboard' },
      { source: '/irrigation-management.html', destination: '/irrigation-management' }
    ]
  }
};

export default nextConfig;
