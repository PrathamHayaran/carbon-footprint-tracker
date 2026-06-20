import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker / Cloud Run
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
