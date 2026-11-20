import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { apagarFoto } from "@/lib/fotos";
import type { InfoBairro } from "@/lib/imoveis";
import type { Resultado } from "./imoveis";
import { perfilCompleto } from "./perfil";
import { faltaParaPublicar, gerarSlug } from "./regras";
import { FOTOS_MINIMAS, type DadosImovel } from "./schema";
import type { ImovelPainel } from "./tipos";

// Imóveis do corretor no Prisma. Mesmas assinaturas e regras de src/mocks/painel-imoveis.ts.
// Toda consulta filtra por `corretorId` (RN-07, RNF-08): imóvel de outro corretor se comporta
// como inexistente.

const naoEncontrado = { ok: false, erro: "Imóvel não encontrado." } as const;

const incluir = { fotos: { orderBy: { ordem: "asc" } } } satisfies Prisma.ImovelInclude;
type Linha = Prisma.ImovelGetPayload<{ include: typeof incluir }>;

const num = (d: Prisma.Decimal | null) => (d === null ? null : d.toNumber());

function paraPainel(i: Linha): ImovelPainel {
  return {
    id: i.id,
    corretorId: i.corretorId,
    slug: i.slug,
    status: i.status,
    tipo: i.tipo,
    finalidade: i.finalidade,
    titulo: i.titulo,
    descricao: i.descricao,
    bairro: i.bairro,
    cidade: i.cidade,
    endereco: i.endereco,
    mostrarEndereco: i.mostrarEndereco,
    latitude: num(i.latitude),
    longitude: num(i.longitude),
    preco: i.preco.toNumber(),
    condominio: num(i.condominio),
    iptu: num(i.iptu),
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    areaM2: i.areaM2.toNumber(),
    aceitaFinanciamento: i.aceitaFinanciamento,
    aceitaFgts: i.aceitaFgts,
    caracteristicas: i.caracteristicas,
    infoAdicional: i.infoAdicional,
    infoBairro: (i.infoBairro as InfoBairro | null) ?? null,
    publicadoEm: i.publicadoEm?.toISOString() ?? null,
    fotos: i.fotos.map((f) => ({ id: f.id, fileId: f.fileId, legenda: f.legenda, ordem: f.ordem })),
  };
}

async function achar(corretorId: string, id: string) {
  return db.imovel.findFirst({ where: { id, corretorId }, include: incluir });
}

async function carregar(corretorId: string, id: string): Promise<ImovelPainel | null> {
  const i = await achar(corretorId, id);
  return i ? paraPainel(i) : null;
}

/** RN-03: slug gerado dos dados, com sufixo numérico se já existir. */
async function slugLivre(dados: Parameters<typeof gerarSlug>[0], exceto?: string) {
  const base = gerarSlug(dados, new Set());
  const parecidos = await db.imovel.findMany({
    where: { slug: { startsWith: base }, ...(exceto ? { id: { not: exceto } } : {}) },
    select: { slug: true },
  });
  return gerarSlug(dados, new Set(parecidos.map((p) => p.slug)));
}

const colisao = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function listarImoveis(corretorId: string): Promise<ImovelPainel[]> {
  const lista = await db.imovel.findMany({ where: { corretorId }, include: incluir, orderBy: { criadoEm: "desc" } });
  return lista.map(paraPainel);
}

export async function buscarImovel(corretorId: string, id: string): Promise<ImovelPainel | null> {
  return carregar(corretorId, id);
}

export async function criarImovel(corretorId: string, dados: DadosImovel): Promise<ImovelPainel> {
  // Dois cadastros simultâneos podem pegar o mesmo slug: o índice único recusa e tenta de novo.
  for (let tentativa = 0; ; tentativa++) {
    try {
      const i = await db.imovel.create({
        data: { ...dados, corretorId, slug: await slugLivre(dados), status: "rascunho" },
        include: incluir,
      });
      return paraPainel(i);
    } catch (e) {
      if (!colisao(e) || tentativa >= 2) throw e;
    }
  }
}

export async function atualizarImovel(corretorId: string, id: string, dados: DadosImovel): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const atual = await achar(corretorId, id);
  if (!atual) return naoEncontrado;
  // RN-03: o slug só muda enquanto o imóvel nunca foi publicado.
  const slug = atual.publicadoEm ? atual.slug : await slugLivre(dados, id);
  const i = await db.imovel.update({ where: { id }, data: { ...dados, slug }, include: incluir });
  return { ok: true, imovel: paraPainel(i) };
}

export async function publicarImovel(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const atual = await achar(corretorId, id);
  if (!atual) return naoEncontrado;
  if (!perfilCompleto(await db.user.findUnique({ where: { id: corretorId }, select: { name: true, creci: true } }).then((u) => u && { nome: u.name, creci: u.creci }))) {
    return { ok: false, erro: "Complete seu perfil (nome e CRECI) antes de publicar: eles aparecem na página do imóvel." };
  }
  const falta = faltaParaPublicar(paraPainel(atual));
  if (falta.length > 0) return { ok: false, erro: `Para publicar, falta: ${falta.join(", ")}.` };
  const i = await db.imovel.update({
    where: { id },
    data: { status: "publicado", publicadoEm: atual.publicadoEm ?? new Date() },
    include: incluir,
  });
  return { ok: true, imovel: paraPainel(i) };
}

export async function despublicarImovel(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  if (!(await achar(corretorId, id))) return naoEncontrado;
  const i = await db.imovel.update({ where: { id }, data: { status: "rascunho" }, include: incluir });
  return { ok: true, imovel: paraPainel(i) };
}

export async function marcarVendido(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const atual = await achar(corretorId, id);
  if (!atual) return naoEncontrado;
  if (atual.status !== "publicado") return { ok: false, erro: "Só um imóvel publicado pode ser marcado como vendido." };
  const i = await db.imovel.update({ where: { id }, data: { status: "vendido" }, include: incluir });
  return { ok: true, imovel: paraPainel(i) };
}

/** RN-25: ao excluir o imóvel, as fotos saem do storage. */
export async function excluirImovel(corretorId: string, id: string): Promise<Resultado<{ slug: string }>> {
  const atual = await achar(corretorId, id);
  if (!atual) return naoEncontrado;
  await db.imovel.delete({ where: { id } }); // fotos, conversas, visitas e eventos saem em cascata
  await Promise.allSettled(atual.fotos.map((f) => apagarFoto(f.fileId)));
  return { ok: true, slug: atual.slug };
}

// --- Fotos (RN-08: a de ordem 0 é a capa) ---

async function renumerar(tx: Prisma.TransactionClient, imovelId: string) {
  const fotos = await tx.foto.findMany({ where: { imovelId }, orderBy: { ordem: "asc" }, select: { id: true } });
  await Promise.all(fotos.map((f, ordem) => tx.foto.update({ where: { id: f.id }, data: { ordem } })));
}

export async function adicionarFoto(corretorId: string, id: string, fileId: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  if (!(await achar(corretorId, id))) return naoEncontrado;
  await db.$transaction(async (tx) => {
    const ordem = await tx.foto.count({ where: { imovelId: id } });
    await tx.foto.create({ data: { imovelId: id, fileId, ordem } });
  });
  return { ok: true, imovel: (await carregar(corretorId, id))! };
}

export async function removerFotoDoImovel(corretorId: string, id: string, fotoId: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const atual = await achar(corretorId, id);
  const foto = atual?.fotos.find((f) => f.id === fotoId);
  if (!atual || !foto) return naoEncontrado;
  if (atual.status === "publicado" && atual.fotos.length <= FOTOS_MINIMAS) {
    return { ok: false, erro: "Um imóvel publicado precisa de pelo menos 3 fotos. Despublique antes de remover." };
  }
  await db.$transaction(async (tx) => {
    await tx.foto.delete({ where: { id: fotoId } });
    await renumerar(tx, id);
  });
  await apagarFoto(foto.fileId);
  return { ok: true, imovel: (await carregar(corretorId, id))! };
}

export async function moverFoto(corretorId: string, id: string, fotoId: string, direcao: -1 | 1): Promise<Resultado<{ imovel: ImovelPainel }>> {
  if (!(await achar(corretorId, id))) return naoEncontrado;
  await db.$transaction(async (tx) => {
    await renumerar(tx, id);
    const fotos = await tx.foto.findMany({ where: { imovelId: id }, orderBy: { ordem: "asc" }, select: { id: true, ordem: true } });
    const i = fotos.findIndex((f) => f.id === fotoId);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= fotos.length) return;
    await tx.foto.update({ where: { id: fotos[i].id }, data: { ordem: fotos[j].ordem } });
    await tx.foto.update({ where: { id: fotos[j].id }, data: { ordem: fotos[i].ordem } });
  });
  return { ok: true, imovel: (await carregar(corretorId, id))! };
}

export async function legendarFoto(corretorId: string, id: string, fotoId: string, legenda: string): Promise<Resultado> {
  if (!(await achar(corretorId, id))) return naoEncontrado;
  const r = await db.foto.updateMany({ where: { id: fotoId, imovelId: id }, data: { legenda: legenda.trim().slice(0, 200) || null } });
  return r.count > 0 ? { ok: true } : naoEncontrado;
}

// --- Leituras públicas (sem filtro de dono): só `publicado` e `vendido` (RN-01, RN-04) ---

export async function buscarPublicoPorSlug(slug: string): Promise<ImovelPainel | null> {
  const i = await db.imovel.findFirst({ where: { slug, status: { not: "rascunho" } }, include: incluir });
  return i ? paraPainel(i) : null;
}

export async function buscarPublicoPorId(id: string): Promise<ImovelPainel | null> {
  const i = await db.imovel.findFirst({ where: { id, status: { not: "rascunho" } }, include: incluir });
  return i ? paraPainel(i) : null;
}

export async function listarSlugs(soPublicados: boolean): Promise<string[]> {
  const lista = await db.imovel.findMany({
    where: soPublicados ? { status: "publicado" } : { status: { not: "rascunho" } },
    select: { slug: true },
    orderBy: { publicadoEm: "desc" },
  });
  return lista.map((i) => i.slug);
}
