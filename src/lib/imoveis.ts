import { urlDaFoto } from "@/lib/fotos";
import { usarMocks } from "@/lib/mocks";
import { buscarPerfil } from "@/lib/painel/perfil";
import type { ImovelPainel } from "@/lib/painel/tipos";
import type { PerfilCorretor } from "@/mocks/corretor";

export type FotoPublica = { src: string; alt: string; legenda: string | null };

export type InfoBairro = {
  escolas: string[];
  mercados: string[];
  saude: string[];
  distanciaCentro: string;
};

export type CorretorPublico = {
  nome: string;
  creci: string;
  whatsapp: string | null;
  fotoSrc: string | null;
};

export type ImovelPublico = {
  id: string;
  slug: string;
  status: "publicado" | "vendido";
  tipo: "apartamento" | "casa" | "terreno" | "sala_comercial";
  finalidade: "venda" | "aluguel";
  titulo: string;
  descricao: string;
  bairro: string;
  cidade: string;
  endereco: string | null;
  mostrarEndereco: boolean;
  latitude: number | null;
  longitude: number | null;
  preco: number;
  condominio: number | null;
  iptu: number | null;
  quartos: number;
  suites: number | null;
  banheiros: number;
  vagas: number;
  areaM2: number;
  aceitaFinanciamento: boolean;
  aceitaFgts: boolean | null;
  caracteristicas: string[];
  // Texto livre do corretor para o atendente; não aparece na página pública.
  infoAdicional: string | null;
  fotos: FotoPublica[];
  infoBairro: InfoBairro | null;
  corretor: CorretorPublico;
};

// Leituras públicas. Com USAR_MOCKS=1 vêm da memória; senão, do Prisma (painel/imoveis-db.ts).
// Só `publicado` e `vendido` (RN-01, RN-04); rascunho = null. Em produção `urlDaFoto` usa o
// Appwrite: o host precisa estar em `images.remotePatterns`.

const fonte = async () => {
  if (!usarMocks()) return await import("@/lib/painel/imoveis-db");
  const { store } = await import("@/mocks/painel");
  return {
    buscarPublicoPorSlug: async (slug: string) => store().imoveis.find((x) => x.slug === slug && x.status !== "rascunho") ?? null,
    buscarPublicoPorId: async (id: string) => store().imoveis.find((x) => x.id === id && x.status !== "rascunho") ?? null,
    listarSlugs: async (soPublicados: boolean) =>
      store()
        .imoveis.filter((i) => (soPublicados ? i.status === "publicado" : i.status !== "rascunho"))
        .map((i) => i.slug),
  };
};

// Só nome, CRECI, WhatsApp e foto do corretor vão para a página (nunca e-mail nem id).
function corretorPublico(p: PerfilCorretor | null): CorretorPublico {
  return {
    nome: p?.nome?.trim() || "Corretor",
    creci: p?.creci?.trim() || "",
    whatsapp: p?.whatsapp ?? null,
    fotoSrc: p?.fotoFileId ? urlDaFoto(p.fotoFileId) : null,
  };
}

// Lista explícita do que vai para a página: nada de id do corretor ou dados internos.
function paraPublico(i: ImovelPainel, corretor: CorretorPublico): ImovelPublico {
  return {
    id: i.id,
    slug: i.slug,
    status: i.status === "vendido" ? "vendido" : "publicado",
    tipo: i.tipo,
    finalidade: i.finalidade,
    titulo: i.titulo,
    descricao: i.descricao,
    bairro: i.bairro,
    cidade: i.cidade,
    endereco: i.endereco,
    mostrarEndereco: i.mostrarEndereco,
    latitude: i.latitude,
    longitude: i.longitude,
    preco: i.preco,
    condominio: i.condominio,
    iptu: i.iptu,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    areaM2: i.areaM2,
    aceitaFinanciamento: i.aceitaFinanciamento,
    aceitaFgts: i.aceitaFgts,
    caracteristicas: i.caracteristicas,
    infoAdicional: i.infoAdicional,
    infoBairro: i.infoBairro,
    fotos: [...i.fotos]
      .sort((a, b) => a.ordem - b.ordem)
      .map((f, n) => ({
        src: urlDaFoto(f.fileId),
        // A legenda vira o texto alternativo (pages.md, 1.5).
        alt: f.legenda ? `${f.legenda} — ${i.titulo}` : `Foto ${n + 1} do ${i.titulo}`,
        legenda: f.legenda,
      })),
    corretor,
  };
}

async function montar(i: ImovelPainel | null): Promise<ImovelPublico | null> {
  return i ? paraPublico(i, corretorPublico(await buscarPerfil(i.corretorId))) : null;
}

/** Visão pública de qualquer status (usada só na pré-visualização do corretor). */
export async function imovelParaPagina(i: ImovelPainel): Promise<ImovelPublico> {
  return paraPublico(i, corretorPublico(await buscarPerfil(i.corretorId)));
}

export async function buscarImovelPublico(slug: string): Promise<ImovelPublico | null> {
  return montar(await (await fonte()).buscarPublicoPorSlug(slug));
}

export async function buscarImovelPublicoPorId(id: string): Promise<ImovelPublico | null> {
  return montar(await (await fonte()).buscarPublicoPorId(id));
}

/** Só os publicados (os vendidos ficam fora do sitemap e do llms.txt, RN-04). */
export async function listarSlugsIndexaveis(): Promise<string[]> {
  return (await fonte()).listarSlugs(true);
}

export async function listarSlugsPublicos(): Promise<string[]> {
  return (await fonte()).listarSlugs(false);
}
