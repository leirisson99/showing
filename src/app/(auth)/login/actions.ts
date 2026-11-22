"use server";

import { redirect } from "next/navigation";
import { dentroDoLimiteDePedidos, enviarLinkDeAcesso, ERRO_ENVIO } from "@/lib/acesso";
import { loginSchema } from "@/lib/auth-schema";
import { usarMocks } from "@/lib/mocks";

export type EstadoLogin = { erro?: string; enviado?: boolean };

function lerEmail(formData: FormData) {
  return loginSchema.safeParse({ email: String(formData.get("email") ?? "") });
}

export async function pedirLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  // USAR_MOCKS=1 (só em desenvolvimento): o painel não exige login.
  if (usarMocks()) redirect("/painel");

  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (await dentroDoLimiteDePedidos(dados.data.email)) {
    if (!(await enviarLinkDeAcesso(dados.data.email))) return { erro: ERRO_ENVIO };
  }
  redirect(`/login/verificar?email=${encodeURIComponent(dados.data.email)}`);
}

export async function reenviarLink(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const dados = lerEmail(formData);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  if (await dentroDoLimiteDePedidos(dados.data.email)) {
    if (!(await enviarLinkDeAcesso(dados.data.email))) return { erro: ERRO_ENVIO };
  }
  return { enviado: true };
}
