import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration to handle firebase-admin (Node.js only)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // On server side, firebase-admin works fine
      return config;
    }

    // On client side, exclude firebase-admin and other node modules
    if (!config.externals) {
      config.externals = [];
    }

    config.externals.push(
      'firebase-admin',
      'firebase-admin/auth',
      'firebase-admin/database',
      'firebase-admin/app'
    );

    return config;
  },

  // Ensure API routes work correctly
  api: {
    responseLimit: '8mb',
  },
};

export default nextConfig;
