import type { NextConfig } from "next";

const API_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

const nextConfig: NextConfig = {
  // Produce a minimal standalone server bundle for the Docker image.
  output: "standalone",
  images: {
    // Self-hosted VPS without an image-optimization CDN: serve images as-is
    // (plain <img>). This makes user uploads at /media/... render reliably
    // (the optimizer can't proxy-fetch them behind Caddy) and keeps remote
    // Unsplash images working without per-host config.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  // Proxy uploaded media through the frontend so it is same-origin (works with
  // next/image as a local path and needs no per-host image config).
  async rewrites() {
    return [
      { source: "/media/:path*", destination: `${API_URL}/media/:path*` },
    ];
  },
};

export default nextConfig;
