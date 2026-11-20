"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";
import { dentroDoLimite } from "@/lib/rate-limit";

export type EstadoLogin = { erro?: string; enviado?: boolean };

const ERRO_ENVIO = "Não foi possível enviar o link agora. Tente de novo em instantes.";

const PEDIDOS_POR_HORA = 5;
const UMA_HORA = 60 * 60 * 1000;

// Envia o link só se o e-mail for de um corretor cadastrado. A resposta é a mesma
// nos dois casos, para não revelar quem tem conta.
async function enviarLink(email: string): Promise<boolean> {
  try {
    const corretor = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!corretor) return true;
    await signIn("email", { email, redirect: false, redirectTo: "/painel" });
    return true;
  } catch {
    // Banco ou e-mail indisponível: mensagem genérica, sem expor o erro nem o e-mail.
    console.error("Falha ao enviar o link de acesso.");
    return false;
  }
}

/** No máximo 5 pedidos por e-mail e por IP a cada hora. Acima disso, a mesma tela, sem novo envio. */
async function dentroDoLimiteDePedidos(email: string): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  const porEmail = dentroDoLimite(`login:email:${email}`, PEDIDOS_POR_HORA, UMA_HORA);
  const porIp = dentroDoLimite(`login:ip:${ip}`, PEDIDOS_POR_HORA, UMA_HORA);
  return porEmail && porIp;
}

function lerEmail(formData: FormData) {
  return loginSchema.safeParse({ email: String(formData.get("email") ?? "") });
}

export async function pedirLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  // USAR_MOCKS=1 (só em desenvolvimento): o painel não exige login.
  if (usarMocks()) redirect("/painel");

  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (await dentroDoLimiteDePedidos(dados.data.email)) {
    if (!(await enviarLink(dados.data.email))) return { erro: ERRO_ENVIO };
  }
  redirect(`/login/verificar?email=${encodeURIComponent(dados.data.email)}`);
}

export async function reenviarLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (await dentroDoLimiteDePedidos(dados.data.email)) {
    if (!(await enviarLink(dados.data.email))) return { erro: ERRO_ENVIO };
  }
  return { enviado: true };
}
