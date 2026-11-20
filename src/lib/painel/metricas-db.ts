import { db } from "@/lib/db";
import type { TipoEvento } from "@/mocks/eventos";
import type { Metricas } from "./metricas";

// Métricas na tabela `Evento`. Nenhum dado pessoal: só tipo, imóvel, conversa (id aleatório) e hora.

const vazio = (): Metricas => ({ visualizacoes: 0, conversas: 0, contatos: 0, visitas: 0 });
const desde = (dias: number, agora: Date) => new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
const campo = { visualizacao: "visualizacoes", contato_capturado: "contatos", visita_pedida: "visitas" } as const;

export async function registrarEvento(tipo: TipoEvento, imovelId: string, conversaId: string | null = null, agora = new Date()): Promise<boolean> {
  const imovel = await db.imovel.findUnique({ where: { id: imovelId }, select: { status: true } });
  if (!imovel || imovel.status === "rascunho") return false;
  await db.evento.create({ data: { tipo, imovelId, conversaId, criadoEm: agora } });
  return true;
}

/** "Conversas" são as que tiveram ao menos uma mensagem do comprador, no período. */
const comMensagem = { NOT: { mensagens: { equals: [] } } };

export async function metricasDoCorretor(corretorId: string, dias = 30, agora = new Date()): Promise<Metricas> {
  const inicio = desde(dias, agora);
  const [eventos, conversas] = await Promise.all([
    db.evento.groupBy({ by: ["tipo"], where: { imovel: { corretorId }, criadoEm: { gte: inicio, lte: agora } }, _count: { _all: true } }),
    db.conversa.count({ where: { imovel: { corretorId }, criadaEm: { gte: inicio, lte: agora }, ...comMensagem } }),
  ]);
  const m = { ...vazio(), conversas };
  for (const e of eventos) if (e.tipo in campo) m[campo[e.tipo as keyof typeof campo]] = e._count._all;
  return m;
}

export async function metricasPorImovel(corretorId: string, dias = 30, agora = new Date()): Promise<Map<string, Metricas>> {
  const inicio = desde(dias, agora);
  const [imoveis, eventos, conversas] = await Promise.all([
    db.imovel.findMany({ where: { corretorId }, select: { id: true } }),
    db.evento.groupBy({ by: ["imovelId", "tipo"], where: { imovel: { corretorId }, criadoEm: { gte: inicio, lte: agora } }, _count: { _all: true } }),
    db.conversa.groupBy({ by: ["imovelId"], where: { imovel: { corretorId }, criadaEm: { gte: inicio, lte: agora }, ...comMensagem }, _count: { _all: true } }),
  ]);
  const resultado = new Map(imoveis.map((i) => [i.id, vazio()]));
  for (const e of eventos) if (e.tipo in campo) resultado.get(e.imovelId)![campo[e.tipo as keyof typeof campo]] = e._count._all;
  for (const c of conversas) resultado.get(c.imovelId)!.conversas = c._count._all;
  return resultado;
}
