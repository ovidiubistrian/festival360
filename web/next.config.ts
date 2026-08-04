import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal standalone server bundle for the Docker image.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
};

export default nextConfig;
