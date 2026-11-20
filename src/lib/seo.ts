export function urlDoSite(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function urlDoImovel(slug: string): string {
  return `${urlDoSite()}/imovel/${slug}`;
}
