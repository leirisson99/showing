"use server";

import { headers } from "next/headers";
import { loginSchema } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";
import { dentroDoLimite } from "@/lib/rate-limit";

export type EstadoInteresse = { ok?: boolean; erro?: string };

const ERRO_ENVIO = "Não foi possível enviar agora. Tente de novo em instantes.";
const PEDIDOS_POR_HORA = 5;

// "Quero participar" da página inicial: guarda só o e-mail para o time falar sobre o piloto. A resposta
// é a mesma para e-mail novo e repetido. Sem dado pessoal em log.
export async function registrarInteresseAction(_: EstadoInteresse, formData: FormData): Promise<EstadoInteresse> {
  const dados = loginSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  if (!dentroDoLimite(`interesse:${ip}`, PEDIDOS_POR_HORA, 60 * 60 * 1000)) return { ok: true }; // não revela o limite

  // USAR_MOCKS=1 (só em desenvolvimento): não grava.
  if (usarMocks()) return { ok: true };

  try {
    await db.interessePiloto.upsert({ where: { email: dados.data.email }, update: {}, create: { email: dados.data.email } });
    return { ok: true };
  } catch {
    console.error("interesse: falha ao registrar");
    return { erro: ERRO_ENVIO };
  }
}
