// Primeira mensagem da conversa (RN-13). É a página que a mostra; o atendente sabe
// que ela já foi exibida (ver prompt.ts) e não se apresenta de novo.

export const SUGESTOES_INICIAIS = ["Aceita financiamento?", "Qual o condomínio?", "Quero agendar uma visita"];

export function textoSaudacao(corretor: string): string {
  return `Oi! Sou o assistente virtual de ${corretor}. Posso tirar dúvidas sobre este imóvel e ajudar a agendar uma visita. Como posso ajudar?`;
}
