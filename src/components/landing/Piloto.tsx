"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { registrarInteresseAction, type EstadoInteresse } from "@/app/interesse-piloto-actions";
import { limitar, suave, useSecao, useMovimentoReduzido } from "./use-secao";

const inicial: EstadoInteresse = {};

// Chamada final. O e-mail vai para a lista do piloto (só o e-mail, para contato sobre o piloto).
export function Piloto() {
  const reduzido = useMovimentoReduzido();
  const { ref, entrada } = useSecao<HTMLElement>();
  const cp = reduzido ? 1 : entrada;
  const [estado, action, pendente] = useActionState(registrarInteresseAction, inicial);

  return (
    <section ref={ref} id="piloto" data-tom="escuro" className="flex min-h-[760px] items-center bg-(--auth-primary) py-24 text-white">
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6"
        style={{ opacity: limitar(cp), transform: `translateY(${reduzido ? 0 : (1 - suave(cp)) * 40}px)` }}
      >
        <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-accent) uppercase">Piloto</span>
        <h2 className="max-w-[16ch] font-[family-name:var(--font-display)] text-[40px] leading-[1.04] font-bold tracking-[-0.03em] sm:text-5xl lg:text-[56px]">Seu próximo imóvel pode atender sozinho.</h2>
        <p className="max-w-[48ch] text-lg text-(--auth-on-primary-muted)">Estamos com um grupo pequeno de corretores testando o Showing. Deixe seu e-mail e a gente conversa.</p>

        {estado.ok ? (
          <p role="status" className="mt-2 flex items-center gap-2 text-lg font-medium">
            <span className="flex size-7 items-center justify-center rounded-full bg-(--auth-accent) text-[#3a2205]">
              <Check className="size-4" aria-hidden />
            </span>
            Recebido! Vamos falar com você.
          </p>
        ) : (
          <form action={action} noValidate className="mt-2 flex w-full max-w-[560px] flex-wrap gap-2.5">
            <label htmlFor="email-piloto" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="email-piloto"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com.br"
              aria-invalid={estado.erro ? true : undefined}
              aria-describedby={estado.erro ? "erro-piloto" : "privacidade-piloto"}
              className="h-14 min-w-0 flex-[1_1_260px] rounded-full border border-white/50 bg-white/10 px-5 text-base text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)"
            />
            <button
              type="submit"
              disabled={pendente}
              className="inline-flex h-14 items-center gap-2 rounded-full bg-(--auth-accent) px-6.5 text-base font-semibold text-[#3a2205] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-progress disabled:opacity-70"
            >
              {pendente && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              {pendente ? "Enviando…" : "Quero participar"}
            </button>
            {estado.erro && (
              <p id="erro-piloto" role="alert" className="flex basis-full items-start gap-1.5 text-sm text-[#ffd5cf]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {estado.erro}
              </p>
            )}
            <p id="privacidade-piloto" className="basis-full text-[13px] text-(--auth-on-primary-muted)">
              Usamos o seu e-mail só para falar sobre o piloto. Veja a{" "}
              <Link href="/privacidade" className="underline underline-offset-2">
                política de privacidade
              </Link>
              .
            </p>
          </form>
        )}

        <Link href="/login" className="inline-flex min-h-11 w-fit items-center text-[15px] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)">
          Já participo · Entrar
        </Link>
      </div>
    </section>
  );
}
