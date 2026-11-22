"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { dentroDoLimiteDePedidos, enviarLinkDeAcesso, ERRO_ENVIO, ipDoPedido } from "@/lib/acesso";
import { cadastroSchema } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";
import { dentroDoLimite } from "@/lib/rate-limit";

export type EstadoCadastro = { erro?: string; campo?: "nome" | "email" | "creci" | "codigo" | "aceite" };

const CADASTROS_POR_HORA = 5;
const UMA_HORA = 60 * 60 * 1000;

function codigoConfere(informado: string | undefined, esperado: string) {
  const a = Buffer.from(informado ?? "");
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Cadastro do corretor: cria a conta (e-mail ainda não confirmado) e manda o link de acesso.
 * Quem já tem conta recebe só o link, sem alterar os dados e sem saber que já existia.
 * Com CADASTRO_CODIGO definido, só entra quem tem o código do convite.
 */
export async function cadastrar(_: EstadoCadastro, formData: FormData): Promise<EstadoCadastro> {
  if (usarMocks()) redirect("/painel");

  const dados = cadastroSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    creci: String(formData.get("creci") ?? "") || undefined,
    codigo: String(formData.get("codigo") ?? "") || undefined,
    aceite: formData.get("aceite") ?? undefined,
  });
  if (!dados.success) {
    const problema = dados.error.issues[0];
    return { erro: problema.message, campo: problema.path[0] as EstadoCadastro["campo"] };
  }

  const esperado = process.env.CADASTRO_CODIGO?.trim();
  if (esperado && !codigoConfere(dados.data.codigo, esperado)) {
    return { erro: "Código de convite inválido. Peça um novo a quem convidou você.", campo: "codigo" };
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`cadastro:ip:${ip}`, CADASTROS_POR_HORA, UMA_HORA)) {
    return { erro: "Muitas tentativas. Tente de novo mais tarde." };
  }

  try {
    await db.user.upsert({
      where: { email: dados.data.email },
      update: {},
      create: { email: dados.data.email, name: dados.data.nome, creci: dados.data.creci || null },
    });
  } catch {
    console.error("Falha ao cadastrar o corretor.");
    return { erro: "Não foi possível concluir o cadastro agora. Tente de novo em instantes." };
  }

  if (await dentroDoLimiteDePedidos(dados.data.email)) {
    if (!(await enviarLinkDeAcesso(dados.data.email))) return { erro: ERRO_ENVIO };
  }
  redirect(`/login/verificar?email=${encodeURIComponent(dados.data.email)}`);
}
