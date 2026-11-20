import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaixaPrevia } from "@/components/imovel/FaixaPrevia";
import { PaginaImovel } from "@/components/imovel/PaginaImovel";
import { imovelParaPagina } from "@/lib/imoveis";
import { buscarImovel } from "@/lib/painel/imoveis";
import { buscarPerfil, perfilCompleto } from "@/lib/painel/perfil";
import { faltaParaPublicar } from "@/lib/painel/regras";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Pré-visualização — Showing", robots: { index: false } };

export default async function PreviaPage({ params }: PageProps<"/painel/imoveis/[id]/previa">) {
  const { id } = await params;
  const corretor = await exigirCorretor();
  const imovel = await buscarImovel(corretor.id, id);
  if (!imovel) notFound();

  const podePublicar = faltaParaPublicar(imovel).length === 0 && perfilCompleto(await buscarPerfil(corretor.id));

  return (
    <PaginaImovel
      imovel={imovelParaPagina(imovel)}
      faixa={<FaixaPrevia imovelId={imovel.id} rascunho={imovel.status === "rascunho"} podePublicar={podePublicar} />}
    />
  );
}
