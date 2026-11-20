import type { MetadataRoute } from "next";
import { listarSlugsIndexaveis } from "@/lib/imoveis";
import { urlDoImovel, urlDoSite } from "@/lib/seo";

// Só páginas públicas e indexáveis: imóvel vendido e rascunho ficam de fora (RN-01, RN-04).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listarSlugsIndexaveis();
  return [
    { url: `${urlDoSite()}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${urlDoSite()}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    ...slugs.map((slug) => ({ url: urlDoImovel(slug), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
