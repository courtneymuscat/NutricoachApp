import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase storage — coach logos, progress photos, meal photos, etc.
      {
        protocol: "https",
        hostname: "tvhqawxuowkzmhfokuzv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
