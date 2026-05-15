

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // In Next.js 16, `quality` values on <Image> must be allow-listed
    // here or they fall back to the default 75 (causing visibly soft
    // images for hero-style panels on large/retina displays).
    qualities: [50, 60, 75, 85, 90, 95, 100],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  compress: true,
}

module.exports = nextConfig
