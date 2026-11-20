import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Mail } from "lucide-react";
import { loginSchema } from "@/lib/auth-schema";
import { Reenviar } from "./reenviar";
import { TituloFocado } from "./titulo-focado";

export const metadata: Metadata = {
  title: "Veja seu e-mail — Showing",
  robots: { index: false },
};

export default function VerificarPage({ searchParams }: PageProps<"/login/verificar">) {
  return (
    <Suspense fallback={null}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Pick<PageProps<"/login/verificar">, "searchParams">) {
  const { email: bruto } = await searchParams;
  const email = loginSchema.safeParse({ email: bruto });

  return (
    <div className="auth-entra mx-auto flex w-full max-w-95 flex-col gap-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-(--auth-primary-soft) text-(--auth-primary)">
        <Mail className="size-[26px]" aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <TituloFocado>Veja seu e-mail</TituloFocado>
        <p className="text-(--auth-ink)">
          {email.success ? (
            <>
              Enviamos um link para <strong className="font-semibold break-all">{email.data.email}</strong>. Abra no mesmo aparelho.
            </>
          ) : (
            "Enviamos um link para o seu e-mail. Abra no mesmo aparelho."
          )}
        </p>
        <p className="text-sm text-(--auth-ink-muted)">Não chegou? Olhe a caixa de spam antes de pedir outro.</p>
      </div>
      <div className="flex flex-col gap-2">
        {email.success && <Reenviar email={email.data.email} />}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center text-[15px] font-medium text-(--auth-primary) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary)"
        >
          Usar outro e-mail
        </Link>
      </div>
    </div>
  );
}
