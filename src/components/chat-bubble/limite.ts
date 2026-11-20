import { LIMITE_MENSAGENS_COMPRADOR } from "@/lib/ai/limites";

type Estado = {
  /** O servidor já avisou que a conversa encerrou. */
  encerradaNoServidor: boolean;
  mensagensDoComprador: number;
  /** O atendente ainda está respondendo. */
  digitando: boolean;
  ultimoPapel: "usuario" | "assistente" | undefined;
};

// RN-16: depois de 30 mensagens do comprador a conversa encerra. Espera a resposta à última
// mensagem terminar, para o comprador ler antes de o campo de texto sumir.
export function conversaEncerrada({ encerradaNoServidor, mensagensDoComprador, digitando, ultimoPapel }: Estado): boolean {
  if (encerradaNoServidor) return true;
  return mensagensDoComprador >= LIMITE_MENSAGENS_COMPRADOR && !digitando && ultimoPapel === "assistente";
}
