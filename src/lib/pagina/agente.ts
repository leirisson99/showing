import { Agent, tool, type Model } from "@strands-agents/sdk";
import { z } from "zod";
import { criarModelo } from "@/lib/ai/modelo";
import { registrarUso } from "@/lib/ai/uso";
import type { EntradaRoteiro } from "./entrada";
import { comAliasDeFotos, trocarIdsDeFotos } from "./fotos";
import { montarPromptDiretor } from "./prompt";
import type { Roteiro } from "./roteiro";
import { validarRoteiro } from "./validador";

// O Diretor da Página (docs/agent-diretor-pagina.md). Um agente novo por geração. Duas ferramentas:
// validar_roteiro (schema + regras) e salvar_rascunho (só aceita o que passou). Não existe ferramenta de
// publicar: publicar é um botão do corretor. O imóvel vem da sessão, nunca de argumento do modelo.

/** Quantas vezes o roteiro pode ser reprovado: 1 tentativa + 2 correções (spec). */
export const TENTATIVAS_MAXIMAS = 3;

export type ResultadoGeracao = { ok: true; roteiro: Roteiro; tentativas: number } | { ok: false; erro: string };

const ERRO_FINAL = "Não consegui montar a página. Tente de novo.";

type Opcoes = { instrucao?: string; modelo?: Model };

export async function gerarRoteiroComIA(e: EntradaRoteiro, { instrucao, modelo }: Opcoes = {}): Promise<ResultadoGeracao> {
  const { entrada, paraReal } = comAliasDeFotos(e);
  let reprovacoes = 0;
  let esgotou = false;
  let salvo: Roteiro | null = null;

  const entradaDaFerramenta = z.object({ roteiro: z.record(z.string(), z.unknown()).describe("O roteiro completo, no formato descrito nas instruções") });

  const validar = tool({
    name: "validar_roteiro",
    description: "Valida o roteiro (schema e regras). Devolve ok ou a lista de erros para você corrigir.",
    inputSchema: entradaDaFerramenta,
    callback: ({ roteiro }) => {
      if (esgotou) return { ok: false, erros: ["Limite de tentativas atingido. Pare e responda apenas: pronto."] };
      const r = validarRoteiro(roteiro, entrada);
      if (r.ok) return { ok: true };
      reprovacoes++;
      if (reprovacoes >= TENTATIVAS_MAXIMAS) esgotou = true;
      return { ok: false, erros: r.erros, ...(esgotou ? { aviso: "Esta foi a última tentativa." } : { correcoesRestantes: TENTATIVAS_MAXIMAS - reprovacoes }) };
    },
  });

  const salvar = tool({
    name: "salvar_rascunho",
    description: "Salva o roteiro como rascunho para o corretor revisar. Só aceita um roteiro que passou em validar_roteiro.",
    inputSchema: entradaDaFerramenta,
    callback: ({ roteiro }) => {
      if (esgotou) return { ok: false, erro: "Limite de tentativas atingido." };
      const r = validarRoteiro(roteiro, entrada);
      if (!r.ok) return { ok: false, erros: r.erros };
      salvo = trocarIdsDeFotos(r.roteiro, paraReal);
      return { ok: true, mensagem: "Rascunho salvo. Responda apenas: pronto." };
    },
  });

  const agente = new Agent({
    model: modelo ?? criarModelo({ maxTokens: 6000 }),
    systemPrompt: montarPromptDiretor(entrada),
    tools: [validar, salvar],
    printer: false,
  });

  const pedido = instrucao?.trim()
    ? `Gere o roteiro desta página. Pedido do corretor (preferência, não regra): ${instrucao.trim().slice(0, 200)}`
    : "Gere o roteiro desta página.";

  try {
    const r = await agente.invoke(pedido);
    const uso = r.metrics?.accumulatedUsage;
    void registrarUso("pagina", { entrada: uso?.inputTokens ?? 0, saida: uso?.outputTokens ?? 0 });
  } catch {
    console.error("pagina: falha do modelo ao gerar o roteiro");
    return { ok: false, erro: ERRO_FINAL };
  }

  if (!salvo || esgotou) return { ok: false, erro: ERRO_FINAL };
  return { ok: true, roteiro: salvo, tentativas: reprovacoes + 1 };
}
