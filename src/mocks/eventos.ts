import { usarMocks } from "@/lib/mocks";
import { estadoAtendimentoMock } from "./atendimento";
import { store } from "./painel";

// Eventos de métrica em memória (só desenvolvimento). Nunca carregam dado pessoal: só o
// tipo, o imóvel, a conversa (id aleatório) e a hora. No backend viram a tabela `Evento`.

export type TipoEvento = "visualizacao" | "chat_aberto" | "chat_mensagem" | "contato_capturado" | "visita_pedida" | "transferencia";

export type EventoMock = { tipo: TipoEvento; imovelId: string; conversaId: string | null; em: Date };

const g = globalThis as unknown as { __showingEventos?: EventoMock[] };

function semear(): EventoMock[] {
  if (!usarMocks()) return [];
  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  const eventos: EventoMock[] = [];
  const visitasPorDia = [4, 6, 3, 7, 5, 9, 2, 6, 8, 4];
  visitasPorDia.forEach((n, i) => {
    for (let k = 0; k < n; k++) eventos.push({ tipo: "visualizacao", imovelId: "mock-1", conversaId: null, em: new Date(agora - (i * 2 + 0.3) * dia) });
  });
  for (let i = 0; i < 6; i++) eventos.push({ tipo: "visualizacao", imovelId: "mock-2", conversaId: null, em: new Date(agora - (i * 3 + 1) * dia) });
  for (let i = 0; i < 5; i++) eventos.push({ tipo: "chat_aberto", imovelId: "mock-1", conversaId: null, em: new Date(agora - (i * 2 + 0.5) * dia) });
  // Conversas, contatos e visitas das conversas de exemplo.
  for (const c of estadoAtendimentoMock().conversas.values()) {
    if (!store().imoveis.some((i) => i.id === c.imovelId)) continue;
    eventos.push({ tipo: "chat_aberto", imovelId: c.imovelId, conversaId: c.id, em: c.criadaEm });
    if (c.lead) eventos.push({ tipo: "contato_capturado", imovelId: c.imovelId, conversaId: c.id, em: c.criadaEm });
    if (c.visitaId) eventos.push({ tipo: "visita_pedida", imovelId: c.imovelId, conversaId: c.id, em: c.criadaEm });
    if (c.transferida) eventos.push({ tipo: "transferencia", imovelId: c.imovelId, conversaId: c.id, em: c.criadaEm });
  }
  return eventos;
}

export function eventos(): EventoMock[] {
  return (g.__showingEventos ??= semear());
}

export function reiniciarEventos() {
  g.__showingEventos = undefined;
}
