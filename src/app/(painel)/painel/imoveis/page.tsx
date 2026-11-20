import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListaImoveis, type ItemLista } from "@/components/painel/ListaImoveis";
import { buttonVariants } from "@/components/ui/button";
import { urlDaFoto } from "@/lib/fotos";
import { listarImoveis } from "@/lib/painel/imoveis";
import { urlDoImovel } from "@/lib/seo";
import { exigirCorretor } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Imóveis — Showing", robots: { index: false } };

export default async function ImoveisPage() {
  const corretor = await exigirCorretor();
  const imoveis = await listarImoveis(corretor.id);

  const itens: ItemLista[] = imoveis.map((i) => {
    const capa = [...i.fotos].sort((a, b) => a.ordem - b.ordem)[0];
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
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold lg:text-[32px]">Imóveis</h1>
        {itens.length > 0 && (
          <Link href="/painel/imoveis/novo" className={cn(buttonVariants(), "h-11 px-4 text-base")}>
            <Plus data-icon="inline-start" /> Novo imóvel
          </Link>
        )}
      </div>
      <ListaImoveis itens={itens} />
    </main>
  );
}
