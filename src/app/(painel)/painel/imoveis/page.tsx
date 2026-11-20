import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { ListaImoveis, type ItemLista } from "@/components/painel/ListaImoveis";
import { botaoEscuro } from "@/components/site/estilos";
import { urlDaFoto } from "@/lib/fotos";
import { listarImoveis } from "@/lib/painel/imoveis";
import { metricasPorImovel } from "@/lib/painel/metricas";
import { urlDoImovel } from "@/lib/seo";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Imóveis — Showing", robots: { index: false } };

export default async function ImoveisPage() {
  const corretor = await exigirCorretor();
  const imoveis = await listarImoveis(corretor.id);
  const metricas = await metricasPorImovel(corretor.id, 30);

  const itens: ItemLista[] = imoveis.map((i) => {
    const capa = [...i.fotos].sort((a, b) => a.ordem - b.ordem)[0];
    const m = metricas.get(i.id);
    return {
      id: i.id,
      slug: i.slug,
      titulo: i.titulo,
      bairro: i.bairro,
      cidade: i.cidade,
      preco: i.preco,
      status: i.status,
      capaSrc: capa ? urlDaFoto(capa.fileId) : null,
      capaAlt: capa?.legenda ?? `Capa de ${i.titulo}`,
      urlPublica: urlDoImovel(i.slug),
      visualizacoes: m?.visualizacoes ?? 0,
      conversas: m?.conversas ?? 0,
      visitas: m?.visitas ?? 0,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <CabecalhoPagina
        rotulo="Seus imóveis"
        titulo="Imóveis"
        descricao="Publicados, rascunhos e vendidos, com os números dos últimos 30 dias."
        acao={
          itens.length > 0 ? (
            <Link href="/painel/imoveis/novo" className={botaoEscuro}>
              <Plus className="size-4" aria-hidden /> Novo imóvel
            </Link>
          ) : undefined
        }
      />
      <ListaImoveis itens={itens} />
    </main>
  );
}
