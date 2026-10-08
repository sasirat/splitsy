import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e dev server (port 3100, local test DB) builds into its own folder,
  // so it can run alongside `pnpm dev` on Neon. See playwright.config.ts.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The playground reads the design-system's TS configs (e.g. font sizes).
  transpilePackages: ["@splitsy/design-system"],
};

export default nextConfig;
