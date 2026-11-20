"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { anonimizarCliente, anonimizarConversa } from "@/lib/painel/atendimentos";
import type { Resultado } from "@/lib/painel/imoveis";
import { exigirCorretor } from "@/lib/session";

// RN-24: o comprador pede a exclusão ao corretor (ou ao contato da /privacidade) e o corretor
// executa aqui. Só conversas de imóveis dele (RN-23).
const id = z.string().min(1);

function atualizar() {
  for (const caminho of ["/painel", "/painel/conversas", "/painel/clientes", "/painel/visitas"]) revalidatePath(caminho);
}

export async function anonimizarConversaAction(conversaId: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(conversaId);
  if (!dados.success) return { ok: false, erro: "Conversa inválida." };
  const r = await anonimizarConversa(corretor.id, dados.data);
  if (r.ok) atualizar();
  return r;
}

export async function anonimizarClienteAction(clienteId: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = id.safeParse(clienteId);
  if (!dados.success) return { ok: false, erro: "Cliente inválido." };
  const r = await anonimizarCliente(corretor.id, dados.data);
  if (r.ok) atualizar();
  return r;
}
