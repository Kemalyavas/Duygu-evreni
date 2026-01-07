import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix root directory detection for Vercel builds
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
