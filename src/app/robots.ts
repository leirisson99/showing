import type { MetadataRoute } from "next";
import { urlDoSite } from "@/lib/seo";

// Painel, login e API não são para buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/painel", "/login", "/api"] }],
    sitemap: `${urlDoSite()}/sitemap.xml`,
  };
}
