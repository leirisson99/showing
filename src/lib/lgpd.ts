import type { MessageData } from "@strands-agents/sdk";
import type { Lead } from "@/lib/ai/repositorio";

// LGPD (RN-24, RNF-14). Por quanto tempo guardamos e como tirar o dado pessoal de uma conversa.

/** Dias sem atividade até a conversa ser anonimizada. Mude em RETENCAO_DIAS; a /privacidade acompanha. */
export const RETENCAO_PADRAO_DIAS = 180;

export function retencaoDias(): number {
  const n = Number(process.env.RETENCAO_DIAS);
  return Number.isInteger(n) && n > 0 ? n : RETENCAO_PADRAO_DIAS;
}

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Telefone brasileiro com ou sem DDD, +55, parênteses, espaço, ponto ou hífen.
const TELEFONE = /(?<!\d)(?:\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}(?!\d)/g;

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Troca e-mail, telefone e o nome informado (inteiro ou por partes) por marcadores. */
export function redigirTexto(texto: string, lead: Lead | null): string {
  let saida = texto.replace(EMAIL, "[e-mail removido]").replace(TELEFONE, "[telefone removido]");
  const partes = (lead?.nome ?? "")
    .split(/\s+/)
    .filter((p) => p.length >= 3)
    .map(escapar);
  if (partes.length > 0) saida = saida.replace(new RegExp(`(?<![\\p{L}])(?:${partes.join("|")})(?![\\p{L}])`, "giu"), "[nome removido]");
  return saida;
}

function redigirJson(valor: unknown, lead: Lead | null): unknown {
  try {
    return JSON.parse(redigirTexto(JSON.stringify(valor ?? null), lead));
  } catch {
    return {}; // na dúvida, apaga os argumentos
  }
}

/** Histórico do agente sem dado pessoal: textos redigidos e os argumentos de `registrar_lead` apagados. */
export function anonimizarMensagens(mensagens: MessageData[], lead: Lead | null): MessageData[] {
  return mensagens.map((m) => ({
    ...m,
    content: m.content.map((bloco) => {
      if ("text" in bloco && typeof bloco.text === "string") return { ...bloco, text: redigirTexto(bloco.text, lead) };
      if ("toolUse" in bloco && ["registrar_lead", "salvar_contato", "pedir_visita"].includes(bloco.toolUse.name)) return { toolUse: { ...bloco.toolUse, input: {} } };
      if ("toolUse" in bloco) return { toolUse: { ...bloco.toolUse, input: redigirJson(bloco.toolUse.input, lead) as never } };
      if ("toolResult" in bloco) {
        return {
          toolResult: {
            ...bloco.toolResult,
            content: bloco.toolResult.content.map((c) => ("text" in c && typeof c.text === "string" ? { ...c, text: redigirTexto(c.text, lead) } : c)),
          },
        };
      }
      return bloco;
    }),
  })) as MessageData[];
}
