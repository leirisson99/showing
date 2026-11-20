import { textoSaudacao } from "@/lib/ai/saudacao";
import type { Lead } from "@/lib/ai/repositorio";
import { perfis } from "@/mocks/corretor";
import { estadoAtendimentoMock, type ConversaMock, type StatusVisitaMock } from "@/mocks/atendimento";
import { store } from "@/mocks/painel";
import type { Resultado } from "./imoveis";

// Visitas e conversas do corretor (cards D1 e D2). Hoje sobre o estado em memória do
// atendente; no backend viram consultas Prisma. Toda função recebe `corretorId` e só enxerga
// o que pertence a imóveis dele (RN-23, RNF-08): o resto se comporta como inexistente.
// Dados do comprador nunca vão para log (LGPD).

export type StatusVisita = StatusVisitaMock;

export type VisitaPainel = {
  id: string;
  imovelId: string;
  imovelTitulo: string;
  conversaId: string;
  dataHora: Date;
  status: StatusVisita;
  comprador: Lead | null;
};

export type ConversaPainel = {
  id: string;
  imovelId: string;
  imovelTitulo: string;
  criadaEm: Date;
  atualizadaEm: Date;
  totalMensagens: number;
  /** Texto da última mensagem (do comprador ou do atendente). */
  ultimaMensagem: string | null;
  transferida: boolean;
  motivoTransferencia: string | null;
  /** Transferida e ainda não lida pelo corretor (pede atenção). */
  naoLida: boolean;
  lead: Lead | null;
  consentimentoEm: Date | null;
  visita: { id: string; status: StatusVisita; dataHora: Date } | null;
};

export type MensagemLida = { de: "comprador" | "atendente"; texto: string };

// RN-20: toda visita nasce `pedida`; só o corretor a leva adiante.
const TRANSICOES: Record<StatusVisita, StatusVisita[]> = {
  pedida: ["confirmada", "cancelada"],
  confirmada: ["realizada", "cancelada"],
  realizada: [],
  cancelada: [],
};

function titulosDoCorretor(corretorId: string): Map<string, string> {
  return new Map(store().imoveis.filter((i) => i.corretorId === corretorId).map((i) => [i.id, i.titulo]));
}

function textoDaMensagem(content: readonly object[]): string {
  return content
    .map((b) => ("text" in b && typeof b.text === "string" ? b.text : ""))
    .join(" ")
    .trim();
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

/** Visitas pedidas ou confirmadas nos próximos `dias` dias (visão geral do painel). */
export async function listarProximasVisitas(corretorId: string, dias = 7, agora = new Date()): Promise<VisitaPainel[]> {
  const limite = agora.getTime() + dias * 24 * 60 * 60 * 1000;
  return (await listarVisitas(corretorId)).filter(
    (v) => (v.status === "pedida" || v.status === "confirmada") && v.dataHora.getTime() >= agora.getTime() && v.dataHora.getTime() <= limite,
  );
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

// --- Clientes (compradores que informaram contato) ---------------------------------
// Não há conta de comprador: um "cliente" é o contato guardado, com consentimento, nas
// conversas. Conversas com o mesmo telefone ou e-mail viram um só cliente. O id é o da
// conversa mais antiga do grupo (opaco), para o contato não aparecer na URL nem em logs.

export type ClientePainel = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  pagamento: string | null;
  prazo: string | null;
  consentimentoEm: Date | null;
  primeiraConversaEm: Date;
  ultimaAtividade: Date;
  imoveis: { id: string; titulo: string }[];
  conversaIds: string[];
  transferida: boolean;
  visitas: (Pick<VisitaPainel, "id" | "status" | "dataHora" | "imovelId" | "imovelTitulo">)[];
};

const digitos = (t: string) => t.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

function chaveDoCliente(c: ConversaPainel): string {
  const lead = c.lead!;
  if (lead.telefone) return `tel:${digitos(lead.telefone)}`;
  if (lead.email) return `email:${lead.email.trim().toLowerCase()}`;
  return `conversa:${c.id}`;
}

export async function listarClientes(corretorId: string): Promise<ClientePainel[]> {
  // RN-11: só quem autorizou guardar os dados (listarConversas já entrega `lead` só nesses casos).
  const conversas = (await listarConversas(corretorId)).filter((c) => c.lead !== null);
  const visitas = await listarVisitas(corretorId);

  const grupos = new Map<string, ConversaPainel[]>();
  for (const c of conversas) {
    const chave = chaveDoCliente(c);
    grupos.set(chave, [...(grupos.get(chave) ?? []), c]);
  }

  return [...grupos.values()]
    .map((grupo) => {
      const antigas = [...grupo].sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime());
      const mais = antigas[0];
      // Os dados mais recentes valem sobre os antigos.
      const lead = antigas.reduce<Lead>((acc, c) => ({ ...acc, ...c.lead! }), antigas[0].lead!);
      const idsDasConversas = new Set(grupo.map((c) => c.id));
      return {
        id: mais.id,
        nome: lead.nome,
        telefone: lead.telefone ?? null,
        email: lead.email ?? null,
        pagamento: lead.pagamento ?? null,
        prazo: lead.prazo ?? null,
        consentimentoEm: antigas.map((c) => c.consentimentoEm).find((d) => d !== null) ?? null,
        primeiraConversaEm: mais.criadaEm,
        ultimaAtividade: new Date(Math.max(...grupo.map((c) => c.atualizadaEm.getTime()))),
        imoveis: [...new Map(grupo.map((c) => [c.imovelId, { id: c.imovelId, titulo: c.imovelTitulo }])).values()],
        conversaIds: antigas.map((c) => c.id).reverse(),
        transferida: grupo.some((c) => c.transferida),
        visitas: visitas
          .filter((v) => idsDasConversas.has(v.conversaId))
          .map(({ id, status, dataHora, imovelId, imovelTitulo }) => ({ id, status, dataHora, imovelId, imovelTitulo })),
      };
    })
    .sort((a, b) => b.ultimaAtividade.getTime() - a.ultimaAtividade.getTime());
}

export async function buscarCliente(corretorId: string, clienteId: string): Promise<ClientePainel | null> {
  return (await listarClientes(corretorId)).find((c) => c.id === clienteId) ?? null;
}

// --- Conversas transferidas: lida / não lida ---------------------------------------

export async function marcarConversaLida(corretorId: string, conversaId: string): Promise<Resultado> {
  const titulos = titulosDoCorretor(corretorId);
  const c = estadoAtendimentoMock().conversas.get(conversaId);
  if (!c || !titulos.has(c.imovelId)) return { ok: false, erro: "Conversa não encontrada." };
  c.lidaEm = new Date();
  return { ok: true };
}

export async function contarNaoLidas(corretorId: string): Promise<number> {
  return (await listarConversas(corretorId)).filter((c) => c.naoLida).length;
}
