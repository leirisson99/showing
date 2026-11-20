"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";

export type EstadoLogin = { erro?: string; enviado?: boolean };

const esquema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});

const ERRO_ENVIO = "Não foi possível enviar o link agora. Tente de novo em instantes.";

// Envia o link só se o e-mail for de um corretor cadastrado. A resposta é a mesma
// nos dois casos, para não revelar quem tem conta.
async function enviarLink(email: string): Promise<boolean> {
  try {
    const corretor = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!corretor) return true;
    await signIn("email", { email, redirect: false, redirectTo: "/painel" });
    return true;
  } catch {
    // Banco ou SMTP indisponível: mensagem genérica, sem expor o erro nem o e-mail.
    console.error("Falha ao enviar o link de acesso.");
    return false;
  }
}

function lerEmail(formData: FormData) {
  return esquema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
}

export async function pedirLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  // USAR_MOCKS=1 (só em desenvolvimento): o painel não exige login.
  if (usarMocks()) redirect("/painel");

  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (!(await enviarLink(dados.data.email))) return { erro: ERRO_ENVIO };
  redirect(`/login/verificar?email=${encodeURIComponent(dados.data.email)}`);
}

export async function reenviarLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (!(await enviarLink(dados.data.email))) return { erro: ERRO_ENVIO };
  return { enviado: true };
}
