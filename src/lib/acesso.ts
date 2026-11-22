import "server-only";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { dentroDoLimite } from "@/lib/rate-limit";

const UMA_HORA = 60 * 60 * 1000;
export const PEDIDOS_POR_HORA = 5;

export const ERRO_ENVIO = "Não foi possível enviar o link agora. Tente de novo em instantes.";

export async function ipDoPedido(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
}

/** No máximo 5 pedidos por e-mail e por IP a cada hora. Acima disso, a mesma tela, sem novo envio. */
export async function dentroDoLimiteDePedidos(email: string): Promise<boolean> {
  const ip = await ipDoPedido();
  const porEmail = dentroDoLimite(`login:email:${email}`, PEDIDOS_POR_HORA, UMA_HORA);
  const porIp = dentroDoLimite(`login:ip:${ip}`, PEDIDOS_POR_HORA, UMA_HORA);
  return porEmail && porIp;
}

/**
 * Envia o link de acesso só se o e-mail for de um corretor cadastrado. A resposta é a mesma
 * nos dois casos, para não revelar quem tem conta.
 */
export async function enviarLinkDeAcesso(email: string): Promise<boolean> {
  try {
    const corretor = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!corretor) return true;
    await signIn("email", { email, redirect: false, redirectTo: "/painel" });
    return true;
  } catch (erro) {
    // Banco ou e-mail indisponível: o usuário vê uma mensagem genérica; o log traz só o tipo
    // e o código do erro (nunca a mensagem, que pode conter o e-mail).
    const e = erro as { name?: string; code?: string; type?: string; cause?: { name?: string; code?: string } };
    console.error("Falha ao enviar o link de acesso.", {
      tipo: e?.name,
      codigo: e?.code ?? e?.type,
      causa: e?.cause?.name,
      codigoCausa: e?.cause?.code,
    });
    return false;
  }
}
