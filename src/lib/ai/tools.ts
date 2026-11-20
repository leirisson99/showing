import { tool } from "@strands-agents/sdk";
import {
  agendarVisita,
  esquemas,
  listarHorarios,
  registrarLead,
  transferirCorretor,
  type ContextoAtendimento,
} from "./atendimento";

// Ferramentas do atendente. Um conjunto novo por requisição, preso à conversa e ao imóvel (ctx).
// As regras ficam em atendimento.ts; aqui só a descrição que o modelo lê.
export function criarTools(ctx: ContextoAtendimento) {
  return [
    tool({
      name: "listar_horarios",
      description:
        "Lista os horários livres para visita ao imóvel. Use sempre antes de oferecer qualquer horário. Nunca ofereça um horário que não venha desta ferramenta.",
      inputSchema: esquemas.listarHorarios,
      callback: (entrada) => listarHorarios(ctx, entrada),
    }),
    tool({
      name: "registrar_lead",
      description:
        "Registra nome e contato do comprador. Só chame depois que o comprador autorizar explicitamente o uso dos dados e com consentimento = true.",
      inputSchema: esquemas.registrarLead,
      callback: (entrada) => registrarLead(ctx, entrada),
    }),
    tool({
      name: "agendar_visita",
      description:
        "Pede a visita em um horário retornado por listar_horarios (use o campo data_hora exatamente como veio). Exige registrar_lead antes. A visita fica como pedida até o corretor confirmar.",
      inputSchema: esquemas.agendarVisita,
      callback: (entrada) => agendarVisita(ctx, entrada),
    }),
    tool({
      name: "transferir_corretor",
      description:
        "Passa a conversa ao corretor quando o comprador pergunta algo que não está na ficha do imóvel, quer negociar ou precisa de atendimento humano. Informe no motivo a pergunta pendente.",
      inputSchema: esquemas.transferirCorretor,
      callback: (entrada) => transferirCorretor(ctx, entrada),
    }),
  ];
}
