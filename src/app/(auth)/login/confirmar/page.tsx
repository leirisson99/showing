import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { loginSchema } from "@/lib/auth-schema";
import { TituloFocado } from "../verificar/titulo-focado";

export const metadata: Metadata = {
  title: "Confirmar acesso — Showing",
  robots: { index: false },
};

export default function ConfirmarPage({ searchParams }: PageProps<"/login/confirmar">) {
  return (
    <Suspense fallback={null}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Pick<PageProps<"/login/confirmar">, "searchParams">) {
  const { token, email: bruto, callbackUrl } = await searchParams;
  const email = loginSchema.safeParse({ email: bruto });
  const valido = typeof token === "string" && token.length > 0 && email.success;

  return (
    <div className="auth-entra mx-auto flex w-full max-w-95 flex-col gap-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-(--auth-primary-soft) text-(--auth-primary)">
        <ShieldCheck className="size-[26px]" aria-hidden />
      </span>
      {valido ? (
        <>
          <div className="flex flex-col gap-1.5">
            <TituloFocado>Confirme seu acesso</TituloFocado>
            <p className="text-(--auth-ink)">
              Entrar no painel como <strong className="font-semibold break-all">{email.data.email}</strong>.
            </p>
            <p className="text-sm text-(--auth-ink-muted)">Esse passo extra evita que o seu leitor de e-mail gaste o link antes de você.</p>
          </div>
          <form method="post" action="/api/login/confirmar" className="flex flex-col gap-2">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={email.data.email} />
            <input type="hidden" name="callbackUrl" value={typeof callbackUrl === "string" ? callbackUrl : "/painel"} />
            <button
              type="submit"
              className="inline-flex h-13 items-center justify-center rounded-[8px] bg-(--auth-primary) text-base font-semibold text-white hover:bg-(--auth-primary-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary)"
            >
              Confirmar e entrar
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <TituloFocado>Link incompleto</TituloFocado>
          <p className="text-(--auth-ink)">Esse link está incompleto. Peça um novo para entrar.</p>
          <Link href="/login" className="inline-flex min-h-11 items-center text-[15px] font-medium text-(--auth-primary) underline underline-offset-2">
            Pedir novo link
          </Link>
        </div>
      )}
    </div>
  );
}
