import { Agent, type MessageData, type Model } from "@strands-agents/sdk";
import type { ImovelPublico } from "@/lib/imoveis";
import type { ContextoAtendimento } from "./atendimento";
import { criarModelo } from "./modelo";
import { montarPrompt } from "./prompt";
import { criarTools } from "./tools";

type Entrada = {
  imovel: ImovelPublico;
  ctx: ContextoAtendimento;
  /** Mensagens anteriores da conversa, como o banco as guarda. */
  historico: MessageData[];
  modelo?: Model;
  agora?: Date;
};

// Um agente novo por requisição, com o histórico carregado do banco. Nada de agente em
// memória global (CLAUDE.md).
export function criarAtendente({ imovel, ctx, historico, modelo, agora }: Entrada): Agent {
  return new Agent({
    model: modelo ?? criarModelo(),
    systemPrompt: montarPrompt(imovel, agora),
    tools: criarTools(ctx),
    messages: historico,
    printer: false,
  });
}
