import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // The dashboard is a client-rendered SPA behind a localStorage auth gate, so
    // route segments are intentionally dropped while the session resolves.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  allowedDevOrigins: ['192.168.43.198'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
