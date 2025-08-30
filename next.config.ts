import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Remove turbopack config that might cause Vercel build issues
  // output: 'standalone', // This can cause issues in Vercel
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
