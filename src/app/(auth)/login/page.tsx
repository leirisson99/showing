import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { usarMocks } from "@/lib/mocks";
import { FormLogin } from "./form-login";

export const metadata: Metadata = {
  title: "Entrar — Showing",
  robots: { index: false },
};

export default function LoginPage() {
  // USAR_MOCKS=1 (só em desenvolvimento): sem login, direto para o painel.
  if (usarMocks()) redirect("/painel");

  return (
    <>
      <FormLogin />
      <Suspense fallback={null}>
        <JaLogado />
      </Suspense>
    </>
  );
}

// Quem já tem sessão e abre /login vai direto para o painel.
async function JaLogado() {
  await connection(); // lê a sessão a cada pedido, nunca na pré-renderização
  if ((await auth())?.user) redirect("/painel");
  return null;
}
