import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O e2e (playwright.config.ts) usa outro diretório para não brigar com o `pnpm dev` aberto.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Fotos de exemplo (src/mocks/unsplash.ts). Em produção entra o host do Appwrite.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
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
