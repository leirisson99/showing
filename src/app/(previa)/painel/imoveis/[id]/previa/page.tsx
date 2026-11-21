import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaixaPrevia } from "@/components/imovel/FaixaPrevia";
import { PaginaImovel } from "@/components/imovel/PaginaImovel";
import { PaginaRoteiro } from "@/components/pagina/PaginaRoteiro";
import { roteiroDaPrevia } from "@/lib/pagina/servico";
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

  const faixa = <FaixaPrevia imovelId={imovel.id} rascunho={imovel.status === "rascunho"} podePublicar={podePublicar} />;
  const publico = await imovelParaPagina(imovel);
  // Mostra a página em capítulos (rascunho mais recente) se o corretor já gerou uma; senão, a página padrão.
  const roteiro = await roteiroDaPrevia(corretor.id, imovel.id);
  return roteiro ? <PaginaRoteiro imovel={publico} roteiro={roteiro.conteudo} faixa={faixa} /> : <PaginaImovel imovel={publico} faixa={faixa} />;
}
