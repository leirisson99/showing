import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" aria-label="Showing, página inicial" className="mx-auto text-primary">
        <Logo />
      </Link>
      <Card className="w-full rounded-3xl p-2">
        <CardHeader>
          <CardTitle className="text-xl">Entrar como corretor</CardTitle>
          <CardDescription>
            Informe seu e-mail e enviaremos um link de acesso. Sem senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormLogin />
        </CardContent>
      </Card>
    </main>
  );
}
