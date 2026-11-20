// Contrato entre os botões da página e a bolha de chat (card C4):
// os botões disparam este evento; a bolha escuta e abre.
export const EVENTO_ABRIR_CHAT = "showing:abrir-chat";

export type ModoChat = "conversa" | "agendamento";

export function abrirChat(modo: ModoChat) {
  window.dispatchEvent(new CustomEvent<ModoChat>(EVENTO_ABRIR_CHAT, { detail: modo }));
}

// A bolha avisa quando termina de carregar, para o pedido feito antes disso não se perder.
export const EVENTO_CHAT_PRONTO = "showing:chat-pronto";
