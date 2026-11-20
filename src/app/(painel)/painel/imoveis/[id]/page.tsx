import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormImovel } from "@/components/painel/FormImovel";
import { PublicacaoImovel } from "@/components/painel/PublicacaoImovel";
import { UploadFotos } from "@/components/painel/UploadFotos";
import { urlDaFoto } from "@/lib/fotos";
import { buscarImovel } from "@/lib/painel/imoveis";
import { faltaParaPublicar } from "@/lib/painel/regras";
import type { DadosImovel } from "@/lib/painel/schema";
import { urlDoImovel } from "@/lib/seo";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Editar imóvel — Showing", robots: { index: false } };

export default async function EditarImovelPage({ params }: PageProps<"/painel/imoveis/[id]">) {
  const { id } = await params;
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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
      <h1 className="text-[26px] font-bold lg:text-[32px]">{imovel.titulo}</h1>
      <PublicacaoImovel
        id={imovel.id}
        titulo={imovel.titulo}
        slug={imovel.slug}
        status={imovel.status}
        falta={faltaParaPublicar(imovel)}
        urlPublica={urlDoImovel(imovel.slug)}
      />
      <section aria-labelledby="titulo-fotos" className="flex flex-col gap-3">
        <h2 id="titulo-fotos" className="text-xl font-semibold">Fotos</h2>
        <UploadFotos imovelId={imovel.id} fotos={fotos} />
      </section>
      <FormImovel imovelId={imovel.id} valores={valores} />
    </main>
  );
}
