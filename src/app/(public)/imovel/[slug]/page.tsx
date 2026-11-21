import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaImovel } from "@/components/imovel/PaginaImovel";
import { PaginaRoteiro } from "@/components/pagina/PaginaRoteiro";
import { roteiroAprovado } from "@/lib/pagina/servico";
import { buscarImovelPublico, listarSlugsPublicos } from "@/lib/imoveis";
import { jsonLdImovel, serializarJsonLd, urlDoImovel } from "@/lib/seo";

// O Cache Components exige ao menos um parâmetro no build. Este endereço nunca existe: serve de reserva quando o
// build roda sem banco (imagem Docker) e vira 404 sem tocar no banco.
const SLUG_DE_RESERVA = "_reserva";

export async function generateStaticParams() {
  try {
    const slugs = await listarSlugsPublicos();
    return [...slugs, SLUG_DE_RESERVA].map((slug) => ({ slug }));
  } catch {
    console.error("generateStaticParams: banco indisponível no build; as páginas serão geradas no primeiro acesso");
    return [{ slug: SLUG_DE_RESERVA }];
  }
}

export async function generateMetadata({ params }: PageProps<"/imovel/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === SLUG_DE_RESERVA) return {};
  const imovel = await buscarImovelPublico(slug);
  if (!imovel) return {};

  // Com a página em capítulos aprovada, o título e a descrição vêm do roteiro (SEO do Diretor da Página).
  const roteiro = (await roteiroAprovado(imovel.id))?.conteudo;
  const titulo = roteiro?.seo.title ?? `${imovel.titulo} — ${imovel.bairro}, ${imovel.cidade}`;
  const descricao = roteiro?.seo.description ?? imovel.descricao.replace(/\s+/g, " ").slice(0, 155);
  const capa = imovel.fotos[0];

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: urlDoImovel(imovel.slug) },
    // RN-04: imóvel vendido não é indexado.
    // Só define quando vendido: um `robots: undefined` apagaria o noindex do ambiente de testes (layout).
    ...(imovel.status === "vendido" ? { robots: { index: false, follow: false } } : {}),
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
  if (slug === SLUG_DE_RESERVA) notFound();
  const imovel = await buscarImovelPublico(slug);
  if (!imovel) notFound();

  const roteiro = await roteiroAprovado(imovel.id);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLdImovel(imovel)) }} />
      {roteiro ? <PaginaRoteiro imovel={imovel} roteiro={roteiro.conteudo} /> : <PaginaImovel imovel={imovel} />}
    </>
  );
}
