import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    // Serve AVIF first (≈40% smaller than WebP for photos), then WebP as fallback.
    formats: ["image/avif", "image/webp"],
    // Quality 90 removed — 85 is visually indistinguishable for festival photography.
    qualities: [65, 75, 85],
    // Cache optimised variants on the CDN for 30 days. Without this, Vercel re-optimises
    // on every cold request after the default short TTL expires.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '172.16.54.52',
    '172.16.54.52:3000',
  ],
};

export default nextConfig;
