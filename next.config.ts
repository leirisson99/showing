import type { NextConfig } from "next";

// Host do Appwrite (de APPWRITE_ENDPOINT), para o next/image carregar as fotos do imóvel.
function hostDoAppwrite() {
  try {
    return process.env.APPWRITE_ENDPOINT ? [{ protocol: "https" as const, hostname: new URL(process.env.APPWRITE_ENDPOINT).hostname, pathname: "/v1/storage/**" }] : [];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // O e2e (playwright.config.ts) usa outro diretório para não brigar com o `pnpm dev` aberto.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Servidor enxuto para a imagem Docker (.next/standalone).
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Fotos de exemplo (src/mocks/unsplash.ts) e as do Appwrite.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, ...hostDoAppwrite()],
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
