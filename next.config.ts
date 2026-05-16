import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase storage — covers both public bucket URLs (logos, etc.)
      // and signed URLs (progress/meal photos with ?token=... query string).
      {
        protocol: "https",
        hostname: "tvhqawxuowkzmhfokuzv.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      // YouTube thumbnails — used in exercise demo previews.
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
