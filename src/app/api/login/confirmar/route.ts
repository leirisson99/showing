import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth-schema";
import { urlDoCallback } from "@/lib/link-acesso";
import { urlDoSite } from "@/lib/seo";

// Recebe o clique no botão "Confirmar acesso" e só então segue para o link que consome o token.
export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const email = loginSchema.safeParse({ email: String(form.get("email") ?? "") });
  const callbackUrl = String(form.get("callbackUrl") ?? "");

  if (!token || token.length > 200 || !email.success) {
    return NextResponse.redirect(new URL("/login", urlDoSite()), 303);
  }
  return NextResponse.redirect(urlDoCallback({ token, email: email.data.email, callbackUrl }, urlDoSite()), 303);
}
