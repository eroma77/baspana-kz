import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    VITE_KASPI_PAY_URL: process.env.VITE_KASPI_PAY_URL,
    VITE_SUPPORT_WHATSAPP: process.env.VITE_SUPPORT_WHATSAPP,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

