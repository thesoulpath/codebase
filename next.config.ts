import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Disable API routes during build to prevent environment variable issues
  output: 'standalone',
  // Set the correct workspace root to resolve lockfile warnings
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hwxrstqeuouefyrwjsjt.supabase.co', // Your Supabase project hostname
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
}

export default nextConfig
