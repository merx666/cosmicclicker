import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg'], // Don't bundle pg, use Node.js native
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
};

export default nextConfig;


