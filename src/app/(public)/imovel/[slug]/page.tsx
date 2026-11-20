import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaImovel } from "@/components/imovel/PaginaImovel";
import { buscarImovelPublico, listarSlugsPublicos } from "@/lib/imoveis";
import { urlDoImovel } from "@/lib/seo";

export async function generateStaticParams() {
  const slugs = await listarSlugsPublicos();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/imovel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const imovel = await buscarImovelPublico(slug);
  if (!imovel) return {};

  const titulo = `${imovel.titulo} — ${imovel.bairro}, ${imovel.cidade}`;
  const descricao = imovel.descricao.replace(/\s+/g, " ").slice(0, 155);
  const capa = imovel.fotos[0];

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: urlDoImovel(imovel.slug) },
    // RN-04: imóvel vendido não é indexado.
    robots: imovel.status === "vendido" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: titulo,
      description: descricao,
      url: urlDoImovel(imovel.slug),
      type: "website",
      locale: "pt_BR",
      images: capa ? [{ url: capa.src, alt: capa.alt }] : undefined,
    },
  };
}

export default async function ImovelPage({ params }: PageProps<"/imovel/[slug]">) {
  const { slug } = await params;
  const imovel = await buscarImovelPublico(slug);
  if (!imovel) notFound();

  return <PaginaImovel imovel={imovel} />;
}
