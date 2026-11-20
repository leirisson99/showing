import { randomUUID } from "node:crypto";
import type { MessageData } from "@strands-agents/sdk";
import { calcularHorariosLivres, type HorariosVisita } from "@/lib/ai/horarios";
import type { ConversaDoAtendimento, ImovelDoAtendimento, Lead, RepositorioAtendimento } from "@/lib/ai/repositorio";
import { usarMocks } from "@/lib/mocks";
import { store } from "./painel";

export type StatusVisitaMock = "pedida" | "confirmada" | "realizada" | "cancelada";

export type ConversaMock = ConversaDoAtendimento & {
  criadaEm: Date;
  atualizadaEm: Date;
  consentimentoEm: Date | null;
  motivo: string | null;
};

export type VisitaMock = {
  id: string;
  imovelId: string;
  conversaId: string;
  dataHora: Date;
  status: StatusVisitaMock;
  criadaEm: Date;
};

type Opcoes = {
  horariosVisita?: HorariosVisita;
  duracaoMin?: number;
  ocupados?: Date[];
  conversaId?: string;
};

const HORARIOS_PADRAO: HorariosVisita = { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] };

// Repositório em memória para desenvolver e testar o atendente sem banco.
// Cada chamada devolve um repositório novo e isolado.
export function criarRepositorioMock(opcoes: Opcoes = {}) {
  const conversaId = opcoes.conversaId ?? "conversa-mock";
  const horariosVisita = opcoes.horariosVisita ?? HORARIOS_PADRAO;
  const ocupados = [...(opcoes.ocupados ?? [])];
  const motivos: string[] = [];
  const visitas: VisitaMock[] = [];
  const conversas = new Map<string, ConversaMock>();
  const historicos = new Map<string, MessageData[]>();

  const nova = (id: string, imovelId: string): ConversaMock => {
    const agora = new Date();
    return {
      id,
      imovelId,
      lead: null,
      consentimento: false,
      visitaId: null,
      transferida: false,
      criadaEm: agora,
      atualizadaEm: agora,
      consentimentoEm: null,
      motivo: null,
    };
  };

  const conversa = (id: string): ConversaMock => {
    let c = conversas.get(id);
    if (!c) {
      c = nova(id, "mock-1");
      conversas.set(id, c);
    }
    return c;
  };
  conversa(conversaId);

  const criarConversaSync = (imovelId: string) => {
    const id = randomUUID();
    conversas.set(id, nova(id, imovelId));
    return id;
  };

  const criarVisitaSync = (imovelId: string, cid: string, dataHora: Date) => {
    const id = `visita-${randomUUID()}`;
    visitas.push({ id, imovelId, conversaId: cid, dataHora, status: "pedida", criadaEm: new Date() });
    const c = conversa(cid);
    c.visitaId = id;
    c.atualizadaEm = new Date();
    return id;
  };

  const repo: RepositorioAtendimento = {
    async buscarImovel(id): Promise<ImovelDoAtendimento | null> {
      const i = store().imoveis.find((x) => x.id === id);
      return i ? { id: i.id, status: i.status } : null;
    },
    async horariosDoCorretor() {
      return { horariosVisita, duracaoMin: opcoes.duracaoMin ?? 60 };
    },
    // RN-17: só visitas pedidas ou confirmadas ocupam horário; cancelada e realizada liberam.
    async visitasOcupadas() {
      return [
        ...ocupados,
        ...visitas.filter((v) => v.status === "pedida" || v.status === "confirmada").map((v) => v.dataHora),
      ];
    },
    async buscarConversa(id) {
      return conversas.get(id) ?? null;
    },
    async salvarLead(id, lead: Lead, consentimentoEm) {
      const c = conversa(id);
      c.lead = { ...c.lead, ...lead };
      c.consentimento = true;
      c.consentimentoEm = consentimentoEm;
      c.atualizadaEm = new Date();
    },
    async criarVisita({ imovelId, conversaId: cid, dataHora }) {
      return { id: criarVisitaSync(imovelId, cid, dataHora) };
    },
    async marcarTransferida(id, motivo) {
      const c = conversa(id);
      c.transferida = true;
      c.motivo = c.motivo ? `${c.motivo} | ${motivo}` : motivo;
      c.atualizadaEm = new Date();
      motivos.push(motivo);
    },
    async criarConversa(imovelId) {
      return criarConversaSync(imovelId);
    },
    async mensagensDaConversa(id) {
      return historicos.get(id) ?? [];
    },
    async salvarMensagens(id, mensagens) {
      historicos.set(id, mensagens);
      conversa(id).atualizadaEm = new Date();
    },
  };

  // `estado` expõe o que foi gravado (testes e telas do painel em desenvolvimento).
  return { repo, conversaId, estado: { conversas, visitas, motivos, historicos }, sync: { criarConversa: criarConversaSync, criarVisita: criarVisitaSync } };
}

type Instancia = ReturnType<typeof criarRepositorioMock>;
export type EstadoAtendimentoMock = Instancia["estado"];

const fala = (role: "user" | "assistant", text: string): MessageData => ({ role, content: [{ text }] });

// Conversas de exemplo para as telas do painel (só com USAR_MOCKS=1). Nomes fictícios.
// Síncrono: tudo já existe quando a primeira tela lê o estado.
function semear({ repo, estado, sync }: Instancia) {
  const agora = new Date();
  const dia = 24 * 60 * 60 * 1000;
  const livres = calcularHorariosLivres({ horariosVisita: HORARIOS_PADRAO, duracaoMin: 60, ocupados: [], agora });

  const dialogo = (pergunta: string, resposta: string): MessageData[] => [
    fala("user", pergunta),
    fala("assistant", resposta),
    fala("user", "Quero agendar uma visita"),
    fala("assistant", "Pedido de visita enviado! O corretor vai confirmar o horário com você."),
  ];

  const comVisita = (imovelId: string, lead: Lead, dataHora: Date, status: StatusVisitaMock, falas: MessageData[], idadeDias: number) => {
    const cid = sync.criarConversa(imovelId);
    void repo.salvarMensagens(cid, falas);
    const criada = new Date(agora.getTime() - idadeDias * dia);
    void repo.salvarLead(cid, lead, criada);
    const vid = sync.criarVisita(imovelId, cid, dataHora);
    const v = estado.visitas.find((x) => x.id === vid)!;
    v.status = status;
    v.criadaEm = criada;
    const c = estado.conversas.get(cid)!;
    c.criadaEm = criada;
    c.atualizadaEm = new Date(criada.getTime() + 20 * 60 * 1000);
  };

  if (livres[0])
    comVisita("mock-1", { nome: "Maria Souza (exemplo)", telefone: "47999990001", pagamento: "Financiamento", prazo: "Até 3 meses" }, livres[0].instante, "pedida", dialogo("Aceita financiamento?", "A ficha informa que aceita. A aprovação depende do banco."), 0.1);
  if (livres[3])
    comVisita("mock-1", { nome: "João Pereira (exemplo)", email: "joao.exemplo@example.com", pagamento: "À vista" }, livres[3].instante, "confirmada", dialogo("Qual o condomínio?", "O condomínio é de R$ 520 por mês, segundo a ficha."), 1);
  comVisita("mock-1", { nome: "Ana Lima (exemplo)", telefone: "47999990003" }, new Date(agora.getTime() - 3 * dia), "realizada", dialogo("Quantos quartos tem?", "São 2 quartos e 68 m² de área, no Victor Konder."), 6);
  comVisita("mock-2", { nome: "Carlos Dias (exemplo)", telefone: "47999990004" }, new Date(agora.getTime() - 2 * dia), "cancelada", dialogo("Ainda está disponível?", "Vou confirmar com o corretor e ele te responde por aqui."), 5);

  const transferida = sync.criarConversa("mock-1");
  void repo.salvarMensagens(transferida, [
    fala("user", "Tem piscina no prédio?"),
    fala("assistant", "Essa informação não está na ficha do imóvel. Vou confirmar com o corretor e ele te responde por aqui."),
  ]);
  void repo.marcarTransferida(transferida, "Pergunta sobre piscina no prédio");

  const curiosa = sync.criarConversa("mock-1");
  void repo.salvarMensagens(curiosa, [fala("user", "Qual o valor?"), fala("assistant", "O valor anunciado é R$ 480.000.")]);
}

// Repositório único do servidor em desenvolvimento (sobrevive entre requisições).
const g = globalThis as unknown as { __showingAtendimento?: Instancia };

function instancia(): Instancia {
  if (!g.__showingAtendimento) {
    g.__showingAtendimento = criarRepositorioMock();
    if (usarMocks()) semear(g.__showingAtendimento);
  }
  return g.__showingAtendimento;
}

export function repositorioMockGlobal(): RepositorioAtendimento {
  return instancia().repo;
}

export function estadoAtendimentoMock(): EstadoAtendimentoMock {
  return instancia().estado;
}

export function reiniciarAtendimentoMock() {
  g.__showingAtendimento = undefined;
}
