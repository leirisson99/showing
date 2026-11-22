import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";

// Controle de gasto do modelo (BK-09): grava só contagens de tokens, nunca texto nem dado do comprador.
// Em memória (USAR_MOCKS=1) nada é gravado.

export type UsoDeTokens = { entrada: number; saida: number };

/** Mensagens do atendente por dia, para o orçamento não estourar (AI_LIMITE_DIARIO, padrão 300). */
export function limiteDiario(): number {
  const n = Number(process.env.AI_LIMITE_DIARIO);
  return Number.isInteger(n) && n > 0 ? n : 300;
}

export async function registrarUso(tipo: "chat" | "descricao" | "pagina", uso: UsoDeTokens, imovelId?: string, corretorId?: string): Promise<void> {
  if (usarMocks()) return;
  try {
    await db.usoIA.create({
      data: { tipo, modelo: process.env.AI_MODEL ?? "desconhecido", imovelId: imovelId ?? null, corretorId: corretorId ?? null, entradaTokens: uso.entrada, saidaTokens: uso.saida },
    });
  } catch {
    // Medir o custo nunca pode derrubar a conversa.
    console.error("ia: falha ao registrar o uso");
  }
}

/** Já passou do limite de mensagens nas últimas 24 horas? */
export async function limiteDiarioAtingido(agora = new Date()): Promise<boolean> {
  if (usarMocks()) return false;
  try {
    const desde = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    return (await db.usoIA.count({ where: { tipo: "chat", criadoEm: { gte: desde } } })) >= limiteDiario();
  } catch {
    return false; // sem conseguir medir, não bloqueia o comprador
  }
}

/** US$ estimados a partir do preço por 1 milhão de tokens (AI_PRECO_ENTRADA e AI_PRECO_SAIDA). Sem preço: null. */
export function custoEstimado(uso: UsoDeTokens, env: Record<string, string | undefined> = process.env): number | null {
  const pe = Number(env.AI_PRECO_ENTRADA);
  const ps = Number(env.AI_PRECO_SAIDA);
  if (!(pe >= 0) || !(ps >= 0) || env.AI_PRECO_ENTRADA === undefined || env.AI_PRECO_ENTRADA === "" || env.AI_PRECO_SAIDA === undefined || env.AI_PRECO_SAIDA === "") return null;
  return (uso.entrada * pe + uso.saida * ps) / 1_000_000;
}
