import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

// Gmail com senha de app (Conta Google → Segurança → Verificação em duas etapas → Senhas de app).
// Só estas variáveis: EMAIL_USER, EMAIL_APP_PASSWORD e EMAIL_FROM_NAME. Para trocar de provedor,
// mude só esta função.
export function emailConfigurado(): boolean {
  return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_APP_PASSWORD?.trim());
}

function criarTransporte() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });
}

type EnviarEmail = {
  para: string;
  assunto: string;
  template: ReactElement;
};

export async function enviarEmail({ para, assunto, template }: EnviarEmail) {
  const html = await render(template);
  await criarTransporte().sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "Showing"}" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
}
