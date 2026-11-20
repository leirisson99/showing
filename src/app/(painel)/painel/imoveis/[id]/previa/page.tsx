import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaImovel } from "@/components/imovel/PaginaImovel";
import { imovelParaPagina } from "@/lib/imoveis";
import { buscarImovel } from "@/lib/painel/imoveis";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Pré-visualização — Showing", robots: { index: false } };

export default async function PreviaPage({ params }: PageProps<"/painel/imoveis/[id]/previa">) {
  const { id } = await params;
  const corretor = await exigirCorretor();
  const imovel = await buscarImovel(corretor.id, id);
  if (!imovel) notFound();

  const aviso =
    imovel.status === "rascunho"
      ? "Pré-visualização: esta página ainda não está publicada."
      : "Pré-visualização do que o comprador vê.";

  return <PaginaImovel imovel={imovelParaPagina(imovel)} aviso={aviso} />;
}
