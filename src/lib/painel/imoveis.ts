import { randomUUID } from "node:crypto";
import { apagarFoto } from "@/lib/fotos";
import { store } from "@/mocks/painel";
import { gerarSlug, faltaParaPublicar } from "./regras";
import type { DadosImovel } from "./schema";
import type { ImovelPainel } from "./tipos";

// Operações do corretor sobre os próprios imóveis. Hoje sobre o store em memória;
// no backend viram consultas Prisma. Toda função recebe `corretorId` e só enxerga
// imóveis dele (RN-07, RNF-08): imóvel de outro corretor se comporta como inexistente.

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };

const naoEncontrado = { ok: false, erro: "Imóvel não encontrado." } as const;

function achar(corretorId: string, id: string) {
  return store().imoveis.find((i) => i.id === id && i.corretorId === corretorId);
}

function slugsExistentes(exceto?: string) {
  return new Set(store().imoveis.filter((i) => i.id !== exceto).map((i) => i.slug));
}

export async function listarImoveis(corretorId: string): Promise<ImovelPainel[]> {
  return store()
    .imoveis.filter((i) => i.corretorId === corretorId)
    .sort((a, b) => b.id.localeCompare(a.id));
}

export async function buscarImovel(corretorId: string, id: string): Promise<ImovelPainel | null> {
  return achar(corretorId, id) ?? null;
}

export async function criarImovel(corretorId: string, dados: DadosImovel): Promise<ImovelPainel> {
  const imovel: ImovelPainel = {
    ...dados,
    id: `imovel-${randomUUID()}`,
    corretorId,
    slug: gerarSlug(dados, slugsExistentes()),
    status: "rascunho",
    latitude: null,
    longitude: null,
    infoBairro: null,
    fotos: [],
    publicadoEm: null,
  };
  store().imoveis.push(imovel);
  return imovel;
}

export async function atualizarImovel(corretorId: string, id: string, dados: DadosImovel): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  Object.assign(imovel, dados);
  // RN-03: o slug só muda enquanto o imóvel nunca foi publicado.
  if (!imovel.publicadoEm) imovel.slug = gerarSlug(imovel, slugsExistentes(id));
  return { ok: true, imovel };
}

export async function publicarImovel(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  const falta = faltaParaPublicar(imovel);
  if (falta.length > 0) return { ok: false, erro: `Para publicar, falta: ${falta.join(", ")}.` };
  imovel.status = "publicado";
  imovel.publicadoEm ??= new Date().toISOString();
  return { ok: true, imovel };
}

export async function despublicarImovel(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  imovel.status = "rascunho";
  return { ok: true, imovel };
}

export async function marcarVendido(corretorId: string, id: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  if (imovel.status !== "publicado") return { ok: false, erro: "Só um imóvel publicado pode ser marcado como vendido." };
  imovel.status = "vendido";
  return { ok: true, imovel };
}

/** RN-25: ao excluir o imóvel, as fotos saem do storage. */
export async function excluirImovel(corretorId: string, id: string): Promise<Resultado<{ slug: string }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  await Promise.all(imovel.fotos.map((f) => apagarFoto(f.fileId)));
  store().imoveis = store().imoveis.filter((i) => i.id !== id);
  return { ok: true, slug: imovel.slug };
}

// --- Fotos (RN-08: a de ordem 0 é a capa) ---

function reordenar(imovel: ImovelPainel) {
  imovel.fotos.sort((a, b) => a.ordem - b.ordem).forEach((f, i) => (f.ordem = i));
}

export async function adicionarFoto(corretorId: string, id: string, fileId: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  imovel.fotos.push({ id: `foto-${randomUUID()}`, fileId, legenda: null, ordem: imovel.fotos.length });
  return { ok: true, imovel };
}

export async function removerFotoDoImovel(corretorId: string, id: string, fotoId: string): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  const foto = imovel?.fotos.find((f) => f.id === fotoId);
  if (!imovel || !foto) return naoEncontrado;
  if (imovel.status === "publicado" && imovel.fotos.length <= 3) {
    return { ok: false, erro: "Um imóvel publicado precisa de pelo menos 3 fotos. Despublique antes de remover." };
  }
  await apagarFoto(foto.fileId);
  imovel.fotos = imovel.fotos.filter((f) => f.id !== fotoId);
  reordenar(imovel);
  return { ok: true, imovel };
}

export async function moverFoto(corretorId: string, id: string, fotoId: string, direcao: -1 | 1): Promise<Resultado<{ imovel: ImovelPainel }>> {
  const imovel = achar(corretorId, id);
  if (!imovel) return naoEncontrado;
  reordenar(imovel);
  const i = imovel.fotos.findIndex((f) => f.id === fotoId);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= imovel.fotos.length) return { ok: true, imovel };
  [imovel.fotos[i].ordem, imovel.fotos[j].ordem] = [imovel.fotos[j].ordem, imovel.fotos[i].ordem];
  reordenar(imovel);
  return { ok: true, imovel };
}

export async function legendarFoto(corretorId: string, id: string, fotoId: string, legenda: string): Promise<Resultado> {
  const foto = achar(corretorId, id)?.fotos.find((f) => f.id === fotoId);
  if (!foto) return naoEncontrado;
  foto.legenda = legenda.trim().slice(0, 200) || null;
  return { ok: true };
}
