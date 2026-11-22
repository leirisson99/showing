"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cadastroSchema } from "@/lib/auth-schema";
import { cn } from "@/lib/utils";
import { cadastrar, type EstadoCadastro } from "./actions";

const inicial: EstadoCadastro = {};

type Campo = NonNullable<EstadoCadastro["campo"]>;

const CLASSE_CAMPO =
  "h-12 rounded-[8px] border bg-(--auth-surface) px-3.5 text-base text-(--auth-ink) transition-[border-color,box-shadow] outline-none focus:border-(--auth-primary) focus:shadow-[0_0_0_3px_rgba(15,61,62,.18)]";

function Rotulo({ id, children, opcional }: { id: string; children: React.ReactNode; opcional?: boolean }) {
  return (
    <label htmlFor={id} className="text-[15px] font-medium">
      {children}
      {opcional && <span className="font-normal text-(--auth-ink-muted)"> (opcional)</span>}
    </label>
  );
}

export function FormCadastro({ pedeCodigo }: { pedeCodigo: boolean }) {
  const [estado, action, pendente] = useActionState(cadastrar, inicial);
  const [local, setLocal] = useState<{ erro: string; campo: Campo } | null>(null);
  const erro = local ?? (estado.erro ? { erro: estado.erro, campo: estado.campo } : null);

  function erroDe(campo: Campo) {
    return erro?.campo === campo ? erro.erro : null;
  }

  // Mesma regra do servidor, sem ida à rede: o erro aparece na hora e o campo recebe o foco.
  function validar(e: FormEvent<HTMLFormElement>) {
    const f = e.currentTarget.elements;
    const campo = (n: string) => f.namedItem(n) as HTMLInputElement;
    const r = cadastroSchema.safeParse({
      nome: campo("nome").value,
      email: campo("email").value,
      creci: campo("creci").value || undefined,
      aceite: campo("aceite").checked ? "on" : undefined,
    });
    if (!r.success) {
      e.preventDefault();
      const problema = r.error.issues[0];
      const nome = problema.path[0] as Campo;
      setLocal({ erro: problema.message, campo: nome });
      campo(nome).focus();
    }
  }

  const limpar = () => local && setLocal(null);

  return (
    <div className="mx-auto flex w-full max-w-95 flex-col gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance md:text-[32px]">Criar conta de corretor</h1>
        <p className="mt-1.5 text-(--auth-ink-muted)">Sem senha. Enviamos um link de acesso para o seu e-mail e você já entra no painel.</p>
      </div>

      <form action={action} onSubmit={validar} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Rotulo id="nome">Nome completo</Rotulo>
          <input id="nome" name="nome" autoComplete="name" autoFocus readOnly={pendente} aria-invalid={erroDe("nome") ? true : false} aria-describedby="nome-erro" onChange={limpar} className={cn(CLASSE_CAMPO, erroDe("nome") ? "border-2 border-(--auth-danger)" : "border-(--auth-line-strong)")} />
          <MensagemErro id="nome-erro" texto={erroDe("nome")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Rotulo id="email">E-mail</Rotulo>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com.br" readOnly={pendente} aria-invalid={erroDe("email") ? true : false} aria-describedby="email-erro" onChange={limpar} className={cn(CLASSE_CAMPO, erroDe("email") ? "border-2 border-(--auth-danger)" : "border-(--auth-line-strong)")} />
          <MensagemErro id="email-erro" texto={erroDe("email")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Rotulo id="creci" opcional>
            CRECI
          </Rotulo>
          <input id="creci" name="creci" placeholder="CRECI-SC 00000" readOnly={pendente} aria-invalid={erroDe("creci") ? true : false} aria-describedby="creci-erro" onChange={limpar} className={cn(CLASSE_CAMPO, erroDe("creci") ? "border-2 border-(--auth-danger)" : "border-(--auth-line-strong)")} />
          <MensagemErro id="creci-erro" texto={erroDe("creci")} />
        </div>

        {pedeCodigo && (
          <div className="flex flex-col gap-1.5">
            <Rotulo id="codigo">Código de convite</Rotulo>
            <input id="codigo" name="codigo" autoComplete="off" readOnly={pendente} aria-invalid={erroDe("codigo") ? true : false} aria-describedby="codigo-erro" onChange={limpar} className={cn(CLASSE_CAMPO, erroDe("codigo") ? "border-2 border-(--auth-danger)" : "border-(--auth-line-strong)")} />
            <MensagemErro id="codigo-erro" texto={erroDe("codigo")} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 text-[14px] leading-snug">
            <input type="checkbox" name="aceite" aria-invalid={erroDe("aceite") ? true : false} aria-describedby="aceite-erro" onChange={limpar} className="mt-0.5 size-5 shrink-0 accent-(--auth-primary)" />
            <span>
              Li e concordo com a{" "}
              <Link href="/privacidade" target="_blank" className="text-(--auth-primary) underline underline-offset-2">
                Política de privacidade
              </Link>
              .
            </span>
          </label>
          <MensagemErro id="aceite-erro" texto={erroDe("aceite")} />
        </div>

        {erro && !erro.campo && <MensagemErro id="cadastro-erro" texto={erro.erro} />}

        <button
          type="submit"
          disabled={pendente}
          className="inline-flex h-13 items-center justify-center gap-2.5 rounded-[8px] bg-(--auth-primary) text-base font-semibold text-white hover:bg-(--auth-primary-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary) disabled:cursor-progress disabled:opacity-70"
        >
          {pendente && <Loader2 className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden />}
          {pendente ? "Criando…" : "Criar conta e receber o link"}
        </button>
      </form>

      <p className="text-[14px] text-(--auth-ink-muted)">
        Já tem conta?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center text-(--auth-primary) underline underline-offset-2 md:min-h-0">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function MensagemErro({ id, texto }: { id: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-(--auth-danger)">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {texto}
    </p>
  );
}
