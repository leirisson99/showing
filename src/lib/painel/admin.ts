import { custoEstimado } from "@/lib/ai/uso";

// Regras e contas do painel admin. Funções puras: sem banco, sem dado de comprador.

export type LinhaDeUso = {
  tipo: string;
  imovelId: string | null;
  corretorId: string | null;
  entradaTokens: number;
  saidaTokens: number;
  criadoEm: Date;
};

export type Gasto = { chamadas: number; entrada: number; saida: number; custo: number | null };

const DIA_MS = 24 * 60 * 60 * 1000;
const FUSO = "America/Sao_Paulo";

/** Admin é quem tem o e-mail em ADMIN_EMAILS (lista separada por vírgula). Sem a variável, ninguém é admin. */
export function ehAdmin(email: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  if (!email) return false;
  const lista = (env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

export function somarUso(linhas: Pick<LinhaDeUso, "entradaTokens" | "saidaTokens">[], env?: Record<string, string | undefined>): Gasto {
  const entrada = linhas.reduce((t, l) => t + l.entradaTokens, 0);
  const saida = linhas.reduce((t, l) => t + l.saidaTokens, 0);
  return { chamadas: linhas.length, entrada, saida, custo: custoEstimado({ entrada, saida }, env) };
}

/** Dia de Brasília no formato AAAA-MM-DD. */
export function diaDeBrasilia(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(data);
}

/** Os últimos `dias` dias (o mais antigo primeiro), incluindo os sem uso. */
export function gastoPorDia(linhas: LinhaDeUso[], dias: number, agora = new Date(), env?: Record<string, string | undefined>): ({ dia: string } & Gasto)[] {
  const porDia = new Map<string, LinhaDeUso[]>();
  for (let i = dias - 1; i >= 0; i--) porDia.set(diaDeBrasilia(new Date(agora.getTime() - i * DIA_MS)), []);
  for (const l of linhas) porDia.get(diaDeBrasilia(l.criadoEm))?.push(l);
  return [...porDia].map(([dia, ls]) => ({ dia, ...somarUso(ls, env) }));
}

export function gastoPorTipo(linhas: LinhaDeUso[], env?: Record<string, string | undefined>): ({ tipo: string } & Gasto)[] {
  const grupos = new Map<string, LinhaDeUso[]>();
  for (const l of linhas) grupos.set(l.tipo, [...(grupos.get(l.tipo) ?? []), l]);
  return [...grupos].map(([tipo, ls]) => ({ tipo, ...somarUso(ls, env) })).sort((a, b) => b.entrada + b.saida - (a.entrada + a.saida));
}

/**
 * Gasto por corretor. Linhas antigas não têm corretorId: usa o dono do imóvel (`donoDoImovel`).
 * O que não dá para atribuir fica na chave `null`.
 */
export function gastoPorCorretor(linhas: LinhaDeUso[], donoDoImovel: Map<string, string>, env?: Record<string, string | undefined>): Map<string | null, Gasto> {
  const grupos = new Map<string | null, LinhaDeUso[]>();
  for (const l of linhas) {
    const dono = l.corretorId ?? (l.imovelId ? (donoDoImovel.get(l.imovelId) ?? null) : null);
    grupos.set(dono, [...(grupos.get(dono) ?? []), l]);
  }
  return new Map([...grupos].map(([dono, ls]) => [dono, somarUso(ls, env)]));
}

/** Quantos itens caíram em cada uma das últimas `semanas` semanas (a última termina agora). */
export function porSemana(datas: Date[], semanas: number, agora = new Date()): { inicio: Date; total: number }[] {
  const lista = Array.from({ length: semanas }, (_, i) => ({ inicio: new Date(agora.getTime() - (semanas - i) * 7 * DIA_MS), total: 0 }));
  for (const d of datas) {
    const idx = lista.findIndex((s, i) => d >= s.inicio && (i === semanas - 1 ? d <= agora : d < lista[i + 1].inicio));
    if (idx >= 0) lista[idx].total++;
  }
  return lista;
}

export const POR_PAGINA = 15;

/** Número da página vindo da URL: inteiro >= 1; qualquer outra coisa vira 1. */
export function lerPagina(valor: string | string[] | undefined): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
