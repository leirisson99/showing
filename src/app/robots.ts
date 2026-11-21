import type { MetadataRoute } from "next";
import { indexacaoLiberada, urlDoSite } from "@/lib/seo";

// Painel, login e API não são para buscadores.
export default function robots(): MetadataRoute.Robots {
  if (!indexacaoLiberada()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/painel", "/login", "/api"] }],
    sitemap: `${urlDoSite()}/sitemap.xml`,
  };
}
