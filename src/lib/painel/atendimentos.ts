import type { Lead } from "@/lib/ai/repositorio";
import { usarMocks } from "@/lib/mocks";
import type { StatusVisitaMock } from "@/mocks/atendimento";
import type { Resultado } from "./imoveis";

// Visitas e conversas do corretor (cards D1 e D2). Com USAR_MOCKS=1 usa a memória
// (src/mocks/painel-atendimentos.ts); senão, o Prisma (atendimentos-db.ts). Toda função recebe `corretorId` e só enxerga
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
  /** Dados pessoais já removidos (RN-24). */
  anonimizadaEm: Date | null;
  visita: { id: string; status: StatusVisita; dataHora: Date } | null;
};

export type MensagemLida = { de: "comprador" | "atendente"; texto: string };

// RN-20: toda visita nasce `pedida`; só o corretor a leva adiante.
export const TRANSICOES: Record<StatusVisita, StatusVisita[]> = {
  pedida: ["confirmada", "cancelada"],
  confirmada: ["realizada", "cancelada"],
  realizada: [],
  cancelada: [],
};

export function textoDaMensagem(content: readonly object[]): string {
  return content
    .map((b) => ("text" in b && typeof b.text === "string" ? b.text : ""))
    .join(" ")
    .trim();
}

const repo = async () => (usarMocks() ? await import("@/mocks/painel-atendimentos") : await import("./atendimentos-db"));

export async function listarVisitas(corretorId: string): Promise<VisitaPainel[]> {
  return (await repo()).listarVisitas(corretorId);
}

export async function alterarStatusVisita(corretorId: string, visitaId: string, novo: StatusVisita): Promise<Resultado<{ status: StatusVisita }>> {
  return (await repo()).alterarStatusVisita(corretorId, visitaId, novo);
}

export async function listarConversas(corretorId: string): Promise<ConversaPainel[]> {
  return (await repo()).listarConversas(corretorId);
}

export async function buscarConversaDoCorretor(corretorId: string, conversaId: string): Promise<{ conversa: ConversaPainel; mensagens: MensagemLida[] } | null> {
  return (await repo()).buscarConversaDoCorretor(corretorId, conversaId);
}

// --- Conversas transferidas: lida / não lida ---------------------------------------

export async function marcarConversaLida(corretorId: string, conversaId: string): Promise<Resultado> {
  return (await repo()).marcarConversaLida(corretorId, conversaId);
}

/** Visitas pedidas ou confirmadas nos próximos `dias` dias (visão geral do painel). */
export async function listarProximasVisitas(corretorId: string, dias = 7, agora = new Date()): Promise<VisitaPainel[]> {
  const limite = agora.getTime() + dias * 24 * 60 * 60 * 1000;
  return (await listarVisitas(corretorId)).filter(
    (v) => (v.status === "pedida" || v.status === "confirmada") && v.dataHora.getTime() >= agora.getTime() && v.dataHora.getTime() <= limite,
  );
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

/** RN-24: remove nome, contato, consentimento e dado pessoal do texto da conversa. As mensagens ficam. */
export async function anonimizarConversa(corretorId: string, conversaId: string): Promise<Resultado> {
  return (await repo()).anonimizarConversa(corretorId, conversaId);
}

/** Anonimiza todas as conversas do cliente (mesmo telefone ou e-mail). */
export async function anonimizarCliente(corretorId: string, clienteId: string): Promise<Resultado> {
  const cliente = await buscarCliente(corretorId, clienteId);
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  for (const id of cliente.conversaIds) {
    const r = await anonimizarConversa(corretorId, id);
    if (!r.ok) return r;
  }
  return { ok: true };
}

export async function contarNaoLidas(corretorId: string): Promise<number> {
  return (await listarConversas(corretorId)).filter((c) => c.naoLida).length;
}
