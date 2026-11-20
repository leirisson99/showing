"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginSchema } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";
import { pedirLink, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = {};
const AJUDA = "Use o e-mail cadastrado no piloto.";

export function FormLogin() {
  const [estado, action, pendente] = useActionState(pedirLink, inicial);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const erro = erroLocal ?? estado.erro ?? null;

  // Mesma regra do servidor, mas sem ida à rede: o campo mostra o erro na hora e recebe o foco.
  function validar(e: FormEvent<HTMLFormElement>) {
    const campo = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const r = loginSchema.safeParse({ email: campo.value });
    if (!r.success) {
      e.preventDefault();
      setErroLocal(r.error.issues[0].message);
      campo.focus();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-95 flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance md:text-[32px]">Entrar no painel</h1>
        <p className="mt-1.5 text-(--auth-ink-muted)">Enviamos um link de acesso para o seu e-mail. Não precisa de senha.</p>
      </div>

      <form action={action} onSubmit={validar} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[15px] font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nome@exemplo.com.br"
            autoFocus
            readOnly={pendente}
            aria-invalid={erro ? true : false}
            aria-describedby="email-ajuda"
            onChange={() => erroLocal && setErroLocal(null)}
            className={cn(
              "h-12 rounded-[8px] border bg-(--auth-surface) px-3.5 text-base text-(--auth-ink) transition-[border-color,box-shadow] outline-none",
              "focus:border-(--auth-primary) focus:shadow-[0_0_0_3px_rgba(15,61,62,.18)]",
              erro ? "border-2 border-(--auth-danger)" : "border-(--auth-line-strong)",
              pendente && "opacity-70",
            )}
          />
          {erro ? (
            <p id="email-ajuda" role="alert" className="flex items-start gap-1.5 text-sm text-(--auth-danger)">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {erro}
            </p>
          ) : (
            <p id="email-ajuda" className="text-sm text-(--auth-ink-muted)">
              {AJUDA}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pendente}
          className="inline-flex h-13 items-center justify-center gap-2.5 rounded-[8px] bg-(--auth-primary) text-base font-semibold text-white hover:bg-(--auth-primary-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary) disabled:cursor-progress disabled:opacity-70"
        >
          {pendente && <Loader2 className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden />}
          {pendente ? "Enviando…" : "Receber link de acesso"}
        </button>
      </form>

      <p className="text-[13px] text-(--auth-ink-muted)">
        Ao entrar, você concorda com a{" "}
        <a href="/privacidade" className="text-(--auth-primary) underline underline-offset-2">
          Política de privacidade
        </a>
        .
      </p>
    </div>
  );
}
