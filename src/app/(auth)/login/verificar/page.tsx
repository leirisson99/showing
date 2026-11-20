import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/Logo";
import { Reenviar } from "./reenviar";

export const metadata: Metadata = {
  title: "Veja seu e-mail — Showing",
  robots: { index: false },
};

export default function VerificarPage({ searchParams }: PageProps<"/login/verificar">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" aria-label="Showing, página inicial" className="mx-auto text-primary">
        <Logo />
      </Link>
      <Suspense>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({ searchParams }: Pick<PageProps<"/login/verificar">, "searchParams">) {
  const { email: bruto } = await searchParams;
  const email = z.email().safeParse(bruto);

  return (
    <Card className="w-full rounded-3xl p-2">
      <CardHeader>
        <CardTitle className="text-xl">Veja seu e-mail</CardTitle>
        <CardDescription>
          {email.success ? (
            <>
              Se <strong>{email.data}</strong> for de um corretor cadastrado, enviamos um link de
              acesso.
            </>
          ) : (
            "Se o e-mail for de um corretor cadastrado, enviamos um link de acesso."
          )}{" "}
          Abra no mesmo aparelho em que você pediu.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {email.success && <Reenviar email={email.data} />}
        <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4">
          Usar outro e-mail
        </Link>
      </CardContent>
    </Card>
  );
}
