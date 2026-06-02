import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy route that only redirected home — make it a permanent (308) redirect
      // so any old/indexed /evren links consolidate to the homepage.
      { source: '/evren', destination: '/', permanent: true },
    ]
  },
};

export default nextConfig;
