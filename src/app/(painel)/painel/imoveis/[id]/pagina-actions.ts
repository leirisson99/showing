"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { aprovarPagina, editarPagina, gerarPagina, usarPaginaPadrao, type Falha } from "@/lib/pagina/servico";
import type { Roteiro } from "@/lib/pagina/roteiro";
import { exigirCorretor } from "@/lib/session";

// Ações da aba "Página" (Diretor da Página). Tudo passa pelo corretor da sessão (RN-07); nada vai ao ar sem ele aprovar (RN-06).

const id = z.string().min(1).max(100);
type Retorno = { ok: true; roteiro?: Roteiro; versao?: number } | Falha;

function atualizar(imovelId: string, slug?: string) {
  revalidatePath(`/painel/imoveis/${imovelId}`);
  if (slug) revalidatePath(`/imovel/${slug}`);
}

export async function gerarPaginaAction(imovelId: unknown, instrucao?: unknown, confirmarSobrescrita?: unknown): Promise<Retorno> {
  const corretor = await exigirCorretor();
  const dados = z.object({ imovelId: id, instrucao: z.string().trim().max(200).optional(), confirmar: z.boolean().optional() }).safeParse({ imovelId, instrucao: instrucao || undefined, confirmar: confirmarSobrescrita === true });
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };
  const r = await gerarPagina(corretor.id, dados.data.imovelId, { instrucao: dados.data.instrucao, confirmarSobrescrita: dados.data.confirmar });
  if (!r.ok) return r;
  atualizar(dados.data.imovelId);
  return { ok: true, roteiro: r.versao.conteudo, versao: r.versao.versao };
}

export async function editarPaginaAction(imovelId: unknown, roteiro: unknown): Promise<Retorno> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(imovelId);
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };
  const r = await editarPagina(corretor.id, dados.data, roteiro);
  if (!r.ok) return r;
  atualizar(dados.data);
  return { ok: true, roteiro: r.versao.conteudo, versao: r.versao.versao };
}

export async function aprovarPaginaAction(imovelId: unknown): Promise<Retorno> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(imovelId);
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };
  const r = await aprovarPagina(corretor.id, dados.data);
  if (!r.ok) return r;
  atualizar(dados.data, r.slug);
  return { ok: true };
}

export async function usarPaginaPadraoAction(imovelId: unknown): Promise<Retorno> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(imovelId);
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };
  const r = await usarPaginaPadrao(corretor.id, dados.data);
  if (!r.ok) return r;
  atualizar(dados.data, r.slug);
  return { ok: true };
}
