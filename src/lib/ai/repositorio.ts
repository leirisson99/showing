import type { MessageData } from "@strands-agents/sdk";
import type { HorariosVisita } from "./horarios";

export type Lead = {
  nome: string;
  telefone?: string;
  email?: string;
  pagamento?: string;
  prazo?: string;
};

export type ImovelDoAtendimento = { id: string; status: "publicado" | "vendido" | "rascunho" };

export type ConversaDoAtendimento = {
  id: string;
  imovelId: string;
  lead: Lead | null;
  consentimento: boolean;
  visitaId: string | null;
  transferida: boolean;
};

/**
 * Tudo o que o atendente precisa do banco. Hoje a implementação é o mock em
 * src/mocks/atendimento.ts; no card C3 entra a versão Prisma, sem mexer nas ferramentas.
 */
export interface RepositorioAtendimento {
  buscarImovel(id: string): Promise<ImovelDoAtendimento | null>;
  horariosDoCorretor(imovelId: string): Promise<{ horariosVisita: HorariosVisita; duracaoMin: number }>;
  /** Visitas `pedida` ou `confirmada` de qualquer imóvel do mesmo corretor. */
  visitasOcupadas(imovelId: string): Promise<Date[]>;
  buscarConversa(id: string): Promise<ConversaDoAtendimento | null>;
  salvarLead(conversaId: string, lead: Lead, consentimentoEm: Date): Promise<void>;
  criarVisita(dados: { imovelId: string; conversaId: string; dataHora: Date }): Promise<{ id: string }>;
  marcarTransferida(conversaId: string, motivo: string): Promise<void>;
  /** Cria uma conversa nova e devolve o id (difícil de adivinhar: quem o tem é o comprador). */
  criarConversa(imovelId: string): Promise<string>;
  /** Histórico completo do agente (inclui chamadas de ferramenta), em `Conversa.mensagens`. */
  mensagensDaConversa(conversaId: string): Promise<MessageData[]>;
  salvarMensagens(conversaId: string, mensagens: MessageData[]): Promise<void>;
}
