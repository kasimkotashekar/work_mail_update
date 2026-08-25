import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16 default)
  // Firebase-admin is automatically excluded from client bundle
  turbopack: {
    resolveAlias: {
      // Ensure firebase-admin is only used server-side
    },
  },
};

export default nextConfig;
