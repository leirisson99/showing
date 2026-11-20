import type { MessageData } from "@strands-agents/sdk";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { Lead } from "@/lib/ai/repositorio";
import { anonimizarMensagens, redigirTexto, retencaoDias } from "@/lib/lgpd";

// Anonimização no banco (RN-24): pedido do comprador (pelo corretor, no painel) ou fim do prazo de guarda.
// A conversa fica, sem nome, contato, consentimento nem dado pessoal no texto. A visita fica sem comprador.
// Nunca registre dado pessoal em log: só contagens.

export async function anonimizarConversaNoBanco(conversaId: string): Promise<void> {
  const c = await db.conversa.findUnique({
    where: { id: conversaId },
    select: { perfilLead: true, mensagens: true, motivoTransferencia: true, atualizadaEm: true },
  });
  if (!c) return;
  const lead = (c.perfilLead as Lead | null) ?? null;
  await db.conversa.update({
    where: { id: conversaId },
    data: {
      mensagens: anonimizarMensagens((c.mensagens ?? []) as unknown as MessageData[], lead) as unknown as Prisma.InputJsonValue,
      motivoTransferencia: c.motivoTransferencia ? redigirTexto(c.motivoTransferencia, lead) : null,
      perfilLead: Prisma.DbNull,
      consentimento: false,
      consentimentoEm: null,
      anonimizadaEm: new Date(),
      atualizadaEm: c.atualizadaEm, // não reordena a lista
      versao: { increment: 1 }, // uma resposta do atendente em andamento não desfaz a limpeza
    },
  });
}

/**
 * Anonimiza as conversas sem atividade há mais de `dias` dias (padrão: RETENCAO_DIAS).
 * `soImoveis` restringe a esses imóveis (testes). Fica de fora quem tem visita ainda por acontecer (pedida ou confirmada): o corretor precisa do contato.
 */
export async function aplicarRetencao(agora = new Date(), dias = retencaoDias(), soImoveis?: string[]): Promise<{ anonimizadas: number }> {
  const limite = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  const velhas = await db.conversa.findMany({
    where: {
      anonimizadaEm: null,
      atualizadaEm: { lt: limite },
      ...(soImoveis ? { imovelId: { in: soImoveis } } : {}), // os testes limitam aos próprios dados
      NOT: { visita: { is: { status: { in: ["pedida", "confirmada"] } } } },
    },
    select: { id: true },
  });
  for (const { id } of velhas) await anonimizarConversaNoBanco(id);
  return { anonimizadas: velhas.length };
}
