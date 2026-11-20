import { anonimizarMensagens, redigirTexto } from "@/lib/lgpd";
import { textoSaudacao } from "@/lib/ai/saudacao";
import type { Resultado } from "@/lib/painel/imoveis";
import { TRANSICOES, textoDaMensagem, type ConversaPainel, type MensagemLida, type StatusVisita, type VisitaPainel } from "@/lib/painel/atendimentos";
import { estadoAtendimentoMock, type ConversaMock } from "./atendimento";
import { perfis } from "./corretor";
import { store } from "./painel";

// Versão em memória (USAR_MOCKS=1) das leituras e ações de src/lib/painel/atendimentos.ts.
// A versão Prisma é atendimentos-db.ts; as duas têm as mesmas assinaturas e regras.

function titulosDoCorretor(corretorId: string): Map<string, string> {
  return new Map(store().imoveis.filter((i) => i.corretorId === corretorId).map((i) => [i.id, i.titulo]));
}

export async function listarVisitas(corretorId: string): Promise<VisitaPainel[]> {
  const { visitas, conversas } = estadoAtendimentoMock();
  const titulos = titulosDoCorretor(corretorId);

  return visitas
    .filter((v) => titulos.has(v.imovelId))
    .map((v) => ({
      id: v.id,
      imovelId: v.imovelId,
      imovelTitulo: titulos.get(v.imovelId)!,
      conversaId: v.conversaId,
      dataHora: v.dataHora,
      status: v.status,
      comprador: conversas.get(v.conversaId)?.lead ?? null,
    }))
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
}

export async function alterarStatusVisita(corretorId: string, visitaId: string, novo: StatusVisita): Promise<Resultado<{ status: StatusVisita }>> {
  const titulos = titulosDoCorretor(corretorId);
  const visita = estadoAtendimentoMock().visitas.find((v) => v.id === visitaId && titulos.has(v.imovelId));
  if (!visita) return { ok: false, erro: "Visita não encontrada." };
  if (!TRANSICOES[visita.status].includes(novo)) {
    return { ok: false, erro: `Uma visita ${visita.status} não pode passar para ${novo}.` };
  }
  visita.status = novo;
  return { ok: true, status: novo };
}

function paraConversaPainel(c: ConversaMock, titulo: string): ConversaPainel {
  const { visitas, historicos } = estadoAtendimentoMock();
  const visita = c.visitaId ? visitas.find((v) => v.id === c.visitaId) : undefined;
  const textos = (historicos.get(c.id) ?? []).map((m) => textoDaMensagem(m.content)).filter(Boolean);
  return {
    id: c.id,
    imovelId: c.imovelId,
    imovelTitulo: titulo,
    criadaEm: c.criadaEm,
    atualizadaEm: c.atualizadaEm,
    totalMensagens: (historicos.get(c.id) ?? []).filter((m) => m.role === "user" && textoDaMensagem(m.content)).length,
    ultimaMensagem: textos[textos.length - 1] ?? null,
    transferida: c.transferida,
    motivoTransferencia: c.motivo,
    naoLida: c.transferida && c.lidaEm === null,
    lead: c.consentimento ? c.lead : null, // RN-11: dado pessoal só depois do consentimento
    consentimentoEm: c.consentimentoEm,
    anonimizadaEm: c.anonimizadaEm,
    visita: visita ? { id: visita.id, status: visita.status, dataHora: visita.dataHora } : null,
  };
}

export async function listarConversas(corretorId: string): Promise<ConversaPainel[]> {
  const titulos = titulosDoCorretor(corretorId);
  return [...estadoAtendimentoMock().conversas.values()]
    .filter((c) => titulos.has(c.imovelId) && (estadoAtendimentoMock().historicos.get(c.id) ?? []).length > 0)
    .map((c) => paraConversaPainel(c, titulos.get(c.imovelId)!))
    .sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime());
}

export async function buscarConversaDoCorretor(
  corretorId: string,
  conversaId: string,
): Promise<{ conversa: ConversaPainel; mensagens: MensagemLida[] } | null> {
  const titulos = titulosDoCorretor(corretorId);
  const { conversas, historicos } = estadoAtendimentoMock();
  const c = conversas.get(conversaId);
  if (!c || !titulos.has(c.imovelId)) return null;

  // A saudação é mostrada pela página e não fica no histórico do agente; entra aqui para
  // a leitura refletir o que o comprador viu.
  const mensagens: MensagemLida[] = [{ de: "atendente", texto: textoSaudacao(perfis().get(corretorId)?.nome ?? "o corretor") }];
  for (const m of historicos.get(conversaId) ?? []) {
    const texto = textoDaMensagem(m.content);
    if (texto) mensagens.push({ de: m.role === "user" ? "comprador" : "atendente", texto });
  }
  return { conversa: paraConversaPainel(c, titulos.get(c.imovelId)!), mensagens };
}

export async function marcarConversaLida(corretorId: string, conversaId: string): Promise<Resultado> {
  const titulos = titulosDoCorretor(corretorId);
  const c = estadoAtendimentoMock().conversas.get(conversaId);
  if (!c || !titulos.has(c.imovelId)) return { ok: false, erro: "Conversa não encontrada." };
  c.lidaEm = new Date();
  return { ok: true };
}


export async function anonimizarConversa(corretorId: string, conversaId: string): Promise<Resultado> {
  const c = estadoAtendimentoMock().conversas.get(conversaId);
  if (!c || !titulosDoCorretor(corretorId).has(c.imovelId)) return { ok: false, erro: "Conversa não encontrada." };
  const { historicos } = estadoAtendimentoMock();
  historicos.set(conversaId, anonimizarMensagens(historicos.get(conversaId) ?? [], c.lead));
  c.motivo = c.motivo ? redigirTexto(c.motivo, c.lead) : null;
  c.lead = null;
  c.consentimento = false;
  c.consentimentoEm = null;
  c.anonimizadaEm = new Date();
  return { ok: true };
}
