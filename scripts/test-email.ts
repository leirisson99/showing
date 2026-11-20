import "dotenv/config";
import { VisitaPedida } from "../src/emails/visita-pedida";
import { emailConfigurado, enviarEmail } from "../src/lib/email";

// pnpm tsx scripts/test-email.ts <seu-email> — envia um e-mail de exemplo (dados fictícios).
// Confira também a caixa de spam.
async function main() {
  const para = process.argv[2];
  if (!para) throw new Error("Informe o destinatário: pnpm tsx scripts/test-email.ts voce@exemplo.com");
  if (!emailConfigurado()) throw new Error("Defina EMAIL_USER e EMAIL_APP_PASSWORD no .env");

  await enviarEmail({
    para,
    assunto: "Teste: novo pedido de visita",
    template: VisitaPedida({
      imovel: "Apartamento de 2 quartos no Victor Konder",
      dataHora: "sábado, 22/11, às 10:00",
      comprador: "Maria Teste",
      contato: "(47) 99999-0000",
      duvidas: ["O condomínio inclui água?"],
      link: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/painel/visitas`,
    }),
  });
  console.log("E-mail enviado.");
}

main().catch((e) => {
  console.error("Falha ao enviar:", e instanceof Error ? `${e.name}: ${e.message}` : "erro");
  process.exit(1);
});
