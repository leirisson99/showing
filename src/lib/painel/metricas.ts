import { usarMocks } from "@/lib/mocks";
import type { TipoEvento } from "@/mocks/eventos";

// Métricas do corretor (RF-12, RF-25). Só contagens: nenhum dado pessoal. Cada função recebe
// `corretorId` e só enxerga imóveis dele (RN-07). Com USAR_MOCKS=1 usa a memória
// (src/mocks/painel-metricas.ts); senão, a tabela `Evento` do Prisma (metricas-db.ts).

export type Metricas = {
  visualizacoes: number;
  conversas: number;
  contatos: number;
  visitas: number;
};

const repo = async () => (usarMocks() ? await import("@/mocks/painel-metricas") : await import("./metricas-db"));

/** Registra um evento de um imóvel publicado. Devolve false se o imóvel não existe ou não está no ar. */
export async function registrarEvento(tipo: TipoEvento, imovelId: string, conversaId: string | null = null, agora = new Date()): Promise<boolean> {
  return (await repo()).registrarEvento(tipo, imovelId, conversaId, agora);
}

/** Totais de todos os imóveis do corretor nos últimos `dias` dias (visão geral). */
export async function metricasDoCorretor(corretorId: string, dias = 30, agora = new Date()): Promise<Metricas> {
  return (await repo()).metricasDoCorretor(corretorId, dias, agora);
}

/** Totais por imóvel nos últimos `dias` dias (lista e aba Desempenho). */
export async function metricasPorImovel(corretorId: string, dias = 30, agora = new Date()): Promise<Map<string, Metricas>> {
  return (await repo()).metricasPorImovel(corretorId, dias, agora);
}
