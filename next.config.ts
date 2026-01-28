import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // serverExternalPackages: [],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'void.skyreel.art',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;


