import type { MessageData } from "@strands-agents/sdk";
import type { Lead } from "@/lib/ai/repositorio";
import { textoSaudacao } from "@/lib/ai/saudacao";
import { db } from "@/lib/db";
import type { Resultado } from "./imoveis";
import { TRANSICOES, textoDaMensagem, type ConversaPainel, type MensagemLida, type StatusVisita, type VisitaPainel } from "./atendimentos";

// Visitas e conversas do corretor no Prisma. Mesmas assinaturas e regras de
// src/mocks/painel-atendimentos.ts. Toda consulta filtra pelo dono do imóvel (RN-23, RNF-08):
// o que é de outro corretor se comporta como inexistente. Dado do comprador nunca vai para log.

const doCorretor = (corretorId: string) => ({ imovel: { corretorId } });

const incluirConversa = { imovel: { select: { titulo: true } }, visita: { select: { id: true, status: true, dataHora: true } } } as const;

type LinhaConversa = {
  id: string; imovelId: string; criadaEm: Date; atualizadaEm: Date; mensagens: unknown; transferida: boolean; motivoTransferencia: string | null;
  lidaEm: Date | null; perfilLead: unknown; consentimento: boolean; consentimentoEm: Date | null;
  imovel: { titulo: string }; visita: { id: string; status: StatusVisita; dataHora: Date } | null;
};

function paraConversaPainel(c: LinhaConversa): ConversaPainel {
  const historico = (c.mensagens ?? []) as MessageData[];
  const textos = historico.map((m) => textoDaMensagem(m.content)).filter(Boolean);
  return {
    id: c.id,
    imovelId: c.imovelId,
    imovelTitulo: c.imovel.titulo,
    criadaEm: c.criadaEm,
    atualizadaEm: c.atualizadaEm,
    totalMensagens: historico.filter((m) => m.role === "user" && textoDaMensagem(m.content)).length,
    ultimaMensagem: textos[textos.length - 1] ?? null,
    transferida: c.transferida,
    motivoTransferencia: c.motivoTransferencia,
    naoLida: c.transferida && c.lidaEm === null,
    lead: c.consentimento ? ((c.perfilLead as Lead | null) ?? null) : null, // RN-11
    consentimentoEm: c.consentimentoEm,
    visita: c.visita,
  };
}

export async function listarVisitas(corretorId: string): Promise<VisitaPainel[]> {
  const visitas = await db.visita.findMany({
    where: { corretorId },
    orderBy: { dataHora: "asc" },
    include: { imovel: { select: { titulo: true } }, conversa: { select: { perfilLead: true, consentimento: true } } },
  });
  return visitas.map((v) => ({
    id: v.id,
    imovelId: v.imovelId,
    imovelTitulo: v.imovel.titulo,
    conversaId: v.conversaId,
    dataHora: v.dataHora,
    status: v.status,
    comprador: v.conversa.consentimento ? ((v.conversa.perfilLead as Lead | null) ?? null) : null,
  }));
}

export async function alterarStatusVisita(corretorId: string, visitaId: string, novo: StatusVisita): Promise<Resultado<{ status: StatusVisita }>> {
  const visita = await db.visita.findFirst({ where: { id: visitaId, corretorId }, select: { status: true } });
  if (!visita) return { ok: false, erro: "Visita não encontrada." };
  if (!TRANSICOES[visita.status].includes(novo)) return { ok: false, erro: `Uma visita ${visita.status} não pode passar para ${novo}.` };
  // Só muda se o status ainda é o lido: duas ações ao mesmo tempo não pulam etapa.
  const r = await db.visita.updateMany({ where: { id: visitaId, corretorId, status: visita.status }, data: { status: novo } });
  if (r.count === 0) return { ok: false, erro: "A visita mudou enquanto você a abria. Recarregue a página." };
  return { ok: true, status: novo };
}

export async function listarConversas(corretorId: string): Promise<ConversaPainel[]> {
  const conversas = await db.conversa.findMany({
    where: { ...doCorretor(corretorId), NOT: { mensagens: { equals: [] } } },
    orderBy: { atualizadaEm: "desc" },
    include: incluirConversa,
  });
  return conversas.map(paraConversaPainel);
}

export async function buscarConversaDoCorretor(corretorId: string, conversaId: string): Promise<{ conversa: ConversaPainel; mensagens: MensagemLida[] } | null> {
  const c = await db.conversa.findFirst({
    where: { id: conversaId, ...doCorretor(corretorId) },
    include: { ...incluirConversa, imovel: { select: { titulo: true, corretor: { select: { name: true } } } } },
  });
  if (!c) return null;

  // A saudação é mostrada pela página e não fica no histórico do agente; entra aqui para
  // a leitura refletir o que o comprador viu.
  const mensagens: MensagemLida[] = [{ de: "atendente", texto: textoSaudacao(c.imovel.corretor.name ?? "o corretor") }];
  for (const m of (c.mensagens ?? []) as unknown as MessageData[]) {
    const texto = textoDaMensagem(m.content);
    if (texto) mensagens.push({ de: m.role === "user" ? "comprador" : "atendente", texto });
  }
  return { conversa: paraConversaPainel(c as unknown as LinhaConversa), mensagens };
}

export async function marcarConversaLida(corretorId: string, conversaId: string): Promise<Resultado> {
  const c = await db.conversa.findFirst({ where: { id: conversaId, ...doCorretor(corretorId) }, select: { atualizadaEm: true } });
  if (!c) return { ok: false, erro: "Conversa não encontrada." };
  // Mantém `atualizadaEm`: marcar como lida não reordena a lista de conversas.
  await db.conversa.update({ where: { id: conversaId }, data: { lidaEm: new Date(), atualizadaEm: c.atualizadaEm } });
  return { ok: true };
}
