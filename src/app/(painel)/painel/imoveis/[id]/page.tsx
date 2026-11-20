import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { EditorImovel, type Aba } from "@/components/painel/imovel/EditorImovel";
import { urlDaFoto } from "@/lib/fotos";
import { formatarDataHora } from "@/lib/format";
import { listarConversas, listarVisitas } from "@/lib/painel/atendimentos";
import { buscarImovel } from "@/lib/painel/imoveis";
import { metricasPorImovel } from "@/lib/painel/metricas";
import { buscarPerfil, perfilCompleto } from "@/lib/painel/perfil";
import { faltaParaPublicar } from "@/lib/painel/regras";
import type { DadosImovel } from "@/lib/painel/schema";
import { urlDoImovel } from "@/lib/seo";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Editar imóvel — Showing", robots: { index: false } };

const ABAS: Aba[] = ["dados", "caracteristicas", "fotos", "texto", "revisao", "desempenho"];

export default async function EditarImovelPage({ params, searchParams }: PageProps<"/painel/imoveis/[id]">) {
  const { id } = await params;
  const { aba } = await searchParams;
  const corretor = await exigirCorretor();
  const imovel = await buscarImovel(corretor.id, id);
  if (!imovel) notFound();

  const valores: DadosImovel = {
    tipo: imovel.tipo,
    finalidade: imovel.finalidade,
    titulo: imovel.titulo,
    descricao: imovel.descricao,
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    endereco: imovel.endereco,
    mostrarEndereco: imovel.mostrarEndereco,
    latitude: imovel.latitude,
    longitude: imovel.longitude,
    preco: imovel.preco,
    condominio: imovel.condominio,
    iptu: imovel.iptu,
    quartos: imovel.quartos,
    suites: imovel.suites,
    banheiros: imovel.banheiros,
    vagas: imovel.vagas,
    areaM2: imovel.areaM2,
    aceitaFinanciamento: imovel.aceitaFinanciamento,
    aceitaFgts: imovel.aceitaFgts ?? false,
    caracteristicas: imovel.caracteristicas,
    infoAdicional: imovel.infoAdicional,
  };

  const fotos = [...imovel.fotos]
    .sort((a, b) => a.ordem - b.ordem)
    .map((f) => ({ id: f.id, src: urlDaFoto(f.fileId), legenda: f.legenda }));

  const rascunho = imovel.status === "rascunho";
  const pedida = typeof aba === "string" && (ABAS as string[]).includes(aba) ? (aba as Aba) : null;
  const abaInicial: Aba = pedida && !(rascunho && pedida === "desempenho") ? pedida : "dados";

  const [perfil, metricas, conversas, visitas] = await Promise.all([
    buscarPerfil(corretor.id),
    metricasPorImovel(corretor.id, 30),
    listarConversas(corretor.id),
    listarVisitas(corretor.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <CabecalhoPagina rotulo={rascunho ? "Cadastro do imóvel" : "Seu imóvel"} titulo={imovel.titulo} />
      <EditorImovel
        imovel={{ id: imovel.id, titulo: imovel.titulo, slug: imovel.slug, status: imovel.status, urlPublica: urlDoImovel(imovel.slug) }}
        valores={valores}
        fotos={fotos}
        falta={faltaParaPublicar(imovel)}
        perfilOk={perfilCompleto(perfil)}
        metricas={metricas.get(imovel.id) ?? { visualizacoes: 0, conversas: 0, contatos: 0, visitas: 0 }}
        conversas={conversas
          .filter((c) => c.imovelId === imovel.id)
          .slice(0, 6)
          .map((c) => ({ id: c.id, quando: formatarDataHora(c.atualizadaEm), resumo: c.ultimaMensagem ?? "Sem mensagens", naoLida: c.naoLida }))}
        visitas={visitas
          .filter((v) => v.imovelId === imovel.id)
          .slice(0, 6)
          .map((v) => ({ id: v.id, quando: formatarDataHora(v.dataHora), status: v.status, nome: v.comprador?.nome ?? "Comprador" }))}
        abaInicial={abaInicial}
      />
    </main>
  );
}
