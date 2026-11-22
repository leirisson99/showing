import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { usarMocks } from "@/lib/mocks";
import { FormCadastro } from "./form-cadastro";

export const metadata: Metadata = {
  title: "Criar conta — Showing",
  robots: { index: false },
};

export default function CadastroPage() {
  // USAR_MOCKS=1 (só em desenvolvimento): sem login, direto para o painel.
  if (usarMocks()) redirect("/painel");

  return (
    <Suspense fallback={null}>
      <Formulario />
    </Suspense>
  );
}

async function Formulario() {
  await connection(); // lê a sessão e o convite a cada pedido, nunca na pré-renderização
  if ((await auth())?.user) redirect("/painel");
  return <FormCadastro pedeCodigo={Boolean(process.env.CADASTRO_CODIGO?.trim())} />;
}
