import "dotenv/config";
import { createElement } from "react";
import { ConversaTransferida } from "../src/emails/conversa-transferida";
import { PedidoRecebido } from "../src/emails/pedido-recebido";
import { VisitaAtualizada } from "../src/emails/visita-atualizada";
import { VisitaPedida } from "../src/emails/visita-pedida";
import { emailConfigurado, enviarEmail } from "../src/lib/email";

// pnpm tsx scripts/test-email.ts <seu-email> — envia os 4 e-mails do sistema com dados fictícios.
// Confira também a caixa de spam.
async function main() {
  const para = process.argv[2];
  if (!para) throw new Error("Informe o destinatário: pnpm tsx scripts/test-email.ts voce@exemplo.com");
  if (!emailConfigurado()) throw new Error("Defina EMAIL_USER e EMAIL_APP_PASSWORD no .env");

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const imovel = "Apartamento de 2 quartos no Victor Konder";
  const quando = "21/11/2026, 09:00";
  const envios = [
    ["Teste: novo pedido de visita", createElement(VisitaPedida, { imovel, dataHora: quando, comprador: "Maria Teste", contato: "(47) 99999-0000 · maria@exemplo.com", link: `${site}/painel/visitas` })],
    ["Teste: conversa para você", createElement(ConversaTransferida, { imovel, motivo: "Pergunta sobre piscina no prédio", link: `${site}/painel/conversas` })],
    ["Teste: recebemos o seu pedido de visita", createElement(PedidoRecebido, { nome: "Maria", imovel, dataHora: quando, corretor: "Corretor de Exemplo", link: site })],
    ["Teste: sua visita foi confirmada", createElement(VisitaAtualizada, { nome: "Maria", imovel, dataHora: quando, corretor: "Corretor de Exemplo", situacao: "confirmada", link: site })],
  ] as const;

  for (const [assunto, template] of envios) {
    await enviarEmail({ para, assunto, template });
    console.log("Enviado:", assunto);
  }
}

main().catch((e) => {
  console.error("Falha ao enviar:", e instanceof Error ? `${e.name}: ${e.message}` : "erro");
  process.exit(1);
});
