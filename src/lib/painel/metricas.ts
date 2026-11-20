import { estadoAtendimentoMock } from "@/mocks/atendimento";
import { eventos, type EventoMock, type TipoEvento } from "@/mocks/eventos";
import { store } from "@/mocks/painel";

// Métricas do corretor (RF-12, RF-25). Só contagens: nenhum dado pessoal. Cada função recebe
// `corretorId` e só enxerga imóveis dele (RN-07).

export type Metricas = {
  visualizacoes: number;
  conversas: number;
  contatos: number;
  visitas: number;
};

const VAZIO: Metricas = { visualizacoes: 0, conversas: 0, contatos: 0, visitas: 0 };

/** Registra um evento de um imóvel publicado. Devolve false se o imóvel não existe ou não está no ar. */
export async function registrarEvento(tipo: TipoEvento, imovelId: string, conversaId: string | null = null, agora = new Date()): Promise<boolean> {
  const imovel = store().imoveis.find((i) => i.id === imovelId);
  if (!imovel || imovel.status === "rascunho") return false;
  eventos().push({ tipo, imovelId, conversaId, em: agora });
  return true;
}

function contar(lista: EventoMock[], tipo: TipoEvento) {
  return lista.filter((e) => e.tipo === tipo).length;
}

function resumir(doImovel: EventoMock[], conversas: number): Metricas {
  return {
    visualizacoes: contar(doImovel, "visualizacao"),
    conversas,
    contatos: contar(doImovel, "contato_capturado"),
    visitas: contar(doImovel, "visita_pedida"),
  };
}

/** "Conversas" são as que tiveram ao menos uma mensagem do comprador, no período. */
function conversasNoPeriodo(imovelIds: Set<string>, desde: Date): number {
  const { conversas, historicos } = estadoAtendimentoMock();
  return [...conversas.values()].filter(
    (c) => imovelIds.has(c.imovelId) && c.criadaEm >= desde && (historicos.get(c.id) ?? []).some((m) => m.role === "user"),
  ).length;
}

function desde(dias: number, agora: Date) {
  return new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
}

/** Totais de todos os imóveis do corretor nos últimos `dias` dias (visão geral). */
export async function metricasDoCorretor(corretorId: string, dias = 30, agora = new Date()): Promise<Metricas> {
  const ids = new Set(store().imoveis.filter((i) => i.corretorId === corretorId).map((i) => i.id));
  if (ids.size === 0) return { ...VAZIO };
  const inicio = desde(dias, agora);
  return resumir(eventos().filter((e) => ids.has(e.imovelId) && e.em >= inicio), conversasNoPeriodo(ids, inicio));
}

/** Totais por imóvel nos últimos `dias` dias (lista e aba Desempenho). */
export async function metricasPorImovel(corretorId: string, dias = 30, agora = new Date()): Promise<Map<string, Metricas>> {
  const inicio = desde(dias, agora);
  const resultado = new Map<string, Metricas>();
  for (const imovel of store().imoveis.filter((i) => i.corretorId === corretorId)) {
    const doImovel = eventos().filter((e) => e.imovelId === imovel.id && e.em >= inicio);
    resultado.set(imovel.id, resumir(doImovel, conversasNoPeriodo(new Set([imovel.id]), inicio)));
  }
  return resultado;
}
