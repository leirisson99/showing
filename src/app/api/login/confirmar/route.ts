import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { urlDoCallback } from "@/lib/link-acesso";
import { urlDoSite } from "@/lib/seo";

// Diagnóstico do "Verification" (sem dado pessoal): o token do link existe no banco? Expirou?
// O Auth.js guarda só o hash (token + AUTH_SECRET) e não conta o motivo da recusa.
async function diagnosticar(token: string, email: string) {
  try {
    const hash = createHash("sha256").update(`${token}${process.env.AUTH_SECRET ?? ""}`).digest("hex");
    const [tokensDoEmail, achado] = await Promise.all([
      db.verificationToken.count({ where: { identifier: email } }),
      db.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token: hash } } }),
    ]);
    console.info("[login] confirmação", { tokensDoEmail, achado: Boolean(achado), expirado: achado ? achado.expires.getTime() < Date.now() : null });
  } catch {
    console.error("[login] não foi possível conferir o token");
  }
}

// Recebe o clique no botão "Confirmar acesso" e só então segue para o link que consome o token.
export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const email = loginSchema.safeParse({ email: String(form.get("email") ?? "") });
  const callbackUrl = String(form.get("callbackUrl") ?? "");

  if (!token || token.length > 200 || !email.success) {
    return NextResponse.redirect(new URL("/login", urlDoSite()), 303);
  }
  await diagnosticar(token, email.data.email);
  return NextResponse.redirect(urlDoCallback({ token, email: email.data.email, callbackUrl }, urlDoSite()), 303);
}
