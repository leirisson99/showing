import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

function criarTransporte() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
    from: process.env.EMAIL_FROM,
    to: para,
    subject: assunto,
    html,
  });
}
