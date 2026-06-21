import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: 'output: standalone' removed — only needed for Docker/Cloud Run, not Vercel
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
