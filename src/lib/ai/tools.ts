import { tool } from "@strands-agents/sdk";
import { consultarHorarios, esquemas, pedirVisita, salvarContato, transferirParaCorretor, type ContextoAtendimento } from "./atendimento";

// Ferramentas do atendente. Um conjunto novo por requisição, preso à conversa e ao imóvel (ctx):
// o modelo não passa nem escolhe o imóvel. As regras ficam em atendimento.ts; aqui só a descrição que o modelo lê.
export function criarTools(ctx: ContextoAtendimento) {
  return [
    tool({
      name: "consultar_horarios",
      description:
        "Lista os horários livres do corretor para visitar este imóvel. Use quando o comprador quiser agendar uma visita ou perguntar quando pode ver o imóvel. Ofereça ao comprador apenas os horários retornados aqui; nunca sugira um horário que não veio desta ferramenta. Retorna até 6 horários, cada um com slot_id, dia e hora. a_partir_de (AAAA-MM-DD) é opcional; se o comprador não disser, usa hoje.",
      inputSchema: esquemas.consultarHorarios,
      callback: (entrada) => consultarHorarios(ctx, entrada),
    }),
    tool({
      name: "pedir_visita",
      description:
        "Registra o pedido de visita em um horário escolhido pelo comprador. Use só depois que o comprador escolher um dos horários de consultar_horarios, informar nome e telefone e tocar em \"Pode guardar\". A visita fica como \"pedida\" até o corretor confirmar; nunca diga ao comprador que ela está confirmada. Use o slot_id exatamente como veio de consultar_horarios.",
      inputSchema: esquemas.pedirVisita,
      callback: (entrada) => pedirVisita(ctx, entrada),
    }),
    tool({
      name: "salvar_contato",
      description:
        "Salva ou atualiza os dados do comprador para o corretor entrar em contato. Use quando o comprador informar nome, telefone, e-mail ou forma de pagamento durante a conversa. Só funciona se o comprador tiver aceitado guardar os dados; se recusar, não insista. Todos os campos são opcionais, mas pelo menos um é obrigatório.",
      inputSchema: esquemas.salvarContato,
      callback: (entrada) => salvarContato(ctx, entrada),
    }),
    tool({
      name: "transferir_para_corretor",
      description:
        "Passa a conversa para o corretor. Use quando: a resposta não estiver nos dados do imóvel, o comprador pedir para falar com uma pessoa, o comprador quiser negociar preço ou condições, ou houver uma reclamação. Depois de transferir, avise o comprador que o corretor vai entrar em contato, sem prometer prazo. motivo: sem_resposta, pedido_do_comprador, negociacao ou reclamacao. resumo: uma frase com o que o comprador quer saber.",
      inputSchema: esquemas.transferirParaCorretor,
      callback: (entrada) => transferirParaCorretor(ctx, entrada),
    }),
  ];
}
