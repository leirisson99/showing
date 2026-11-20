"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gerarTituloEDescricao, type TextoGerado } from "@/lib/ai/descricao";
import {
  atualizarImovel,
  buscarImovel,
  criarImovel,
  despublicarImovel,
  excluirImovel,
  legendarFoto,
  marcarVendido,
  moverFoto,
  publicarImovel,
  removerFotoDoImovel,
  type Resultado,
} from "@/lib/painel/imoveis";
import { imovelSchema } from "@/lib/painel/schema";
import { exigirCorretor } from "@/lib/session";

// Mutações do painel. Todas partem do corretor da sessão (RN-07) e validam com Zod.

const id = z.string().min(1);

function atualizarPaginas(imovelId: string, slug?: string) {
  revalidatePath("/painel/imoveis");
  revalidatePath(`/painel/imoveis/${imovelId}`);
  if (slug) revalidatePath(`/imovel/${slug}`);
}

export async function salvarImovel(imovelId: string | null, entrada: unknown): Promise<Resultado<{ id: string }>> {
  const corretor = await exigirCorretor();
  const dados = imovelSchema.safeParse(entrada);
  if (!dados.success) return { ok: false, erro: dados.error.issues[0].message };

  if (imovelId === null) {
    const novo = await criarImovel(corretor.id, dados.data);
    atualizarPaginas(novo.id);
    return { ok: true, id: novo.id };
  }

  const antes = await buscarImovel(corretor.id, imovelId);
  const r = await atualizarImovel(corretor.id, imovelId, dados.data);
  if (!r.ok) return r;
  atualizarPaginas(imovelId, antes?.slug);
  atualizarPaginas(imovelId, r.imovel.slug);
  return { ok: true, id: imovelId };
}

async function mudarStatus(
  entrada: unknown,
  operacao: (corretorId: string, id: string) => Promise<Resultado<{ imovel: { id: string; slug: string } }>>,
): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(entrada);
  if (!dados.success) return { ok: false, erro: "Imóvel inválido." };
  const r = await operacao(corretor.id, dados.data);
  if (!r.ok) return r;
  atualizarPaginas(r.imovel.id, r.imovel.slug);
  return { ok: true };
}

export async function publicarImovelAction(imovelId: unknown) {
  return mudarStatus(imovelId, publicarImovel);
}

export async function despublicarImovelAction(imovelId: unknown) {
  return mudarStatus(imovelId, despublicarImovel);
}

export async function marcarVendidoAction(imovelId: unknown) {
  return mudarStatus(imovelId, marcarVendido);
}

export async function excluirImovelAction(imovelId: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(imovelId);
  if (!dados.success) return { ok: false, erro: "Imóvel inválido." };
  const r = await excluirImovel(corretor.id, dados.data);
  if (!r.ok) return r;
  atualizarPaginas(dados.data, r.slug);
  return { ok: true };
}

export async function removerFotoAction(imovelId: unknown, fotoId: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = z.tuple([id, id]).safeParse([imovelId, fotoId]);
  if (!dados.success) return { ok: false, erro: "Foto inválida." };
  const r = await removerFotoDoImovel(corretor.id, ...dados.data);
  if (!r.ok) return r;
  atualizarPaginas(r.imovel.id, r.imovel.status === "rascunho" ? undefined : r.imovel.slug);
  return { ok: true };
}

export async function moverFotoAction(imovelId: unknown, fotoId: unknown, direcao: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = z.tuple([id, id, z.union([z.literal(-1), z.literal(1)])]).safeParse([imovelId, fotoId, direcao]);
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };
  const r = await moverFoto(corretor.id, ...dados.data);
  if (!r.ok) return r;
  atualizarPaginas(r.imovel.id, r.imovel.status === "rascunho" ? undefined : r.imovel.slug);
  return { ok: true };
}

export async function legendarFotoAction(imovelId: unknown, fotoId: unknown, legenda: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = z.tuple([id, id, z.string().max(200)]).safeParse([imovelId, fotoId, legenda]);
  if (!dados.success) return { ok: false, erro: "Legenda inválida." };
  const r = await legendarFoto(corretor.id, ...dados.data);
  if (!r.ok) return r;
  const imovel = await buscarImovel(corretor.id, dados.data[0]);
  atualizarPaginas(dados.data[0], imovel?.status === "rascunho" ? undefined : imovel?.slug);
  return { ok: true };
}

// RN-06: só devolve texto para o formulário; quem salva e publica é o corretor.
export async function gerarDescricaoAction(entrada: unknown): Promise<Resultado<{ texto: TextoGerado }>> {
  await exigirCorretor();
  const dados = imovelSchema
    .pick({
      tipo: true, finalidade: true, bairro: true, cidade: true, quartos: true, suites: true, banheiros: true,
      vagas: true, areaM2: true, aceitaFinanciamento: true, aceitaFgts: true, caracteristicas: true, infoAdicional: true,
    })
    .safeParse(entrada);
  if (!dados.success) return { ok: false, erro: "Preencha tipo, bairro, cidade e as medidas antes de gerar." };
  return { ok: true, texto: await gerarTituloEDescricao(dados.data) };
}
