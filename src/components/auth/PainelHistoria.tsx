"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Lock, ShieldCheck } from "lucide-react";
import { LogoMarca } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { UNSPLASH, urlUnsplash } from "@/mocks/unsplash";

const INTERVALO_MS = 6000;

const FRASES = [
  "Enquanto você mostra um imóvel, o outro já está atendendo.",
  "A visita chega pronta: dia, hora e contato do comprador.",
  "Os dados dos compradores ficam só com você.",
];

// Cartões de interface do produto. Decorativos: a frase do slide já diz o mesmo.
function Cartao({ indice }: { indice: number }) {
  const base = "auth-cartao hidden max-w-80 flex-col gap-2 self-start rounded-2xl bg-white p-3.5 text-sm text-(--auth-ink) shadow-[0_12px_32px_-8px_rgba(17,24,22,.18),0_2px_6px_rgba(17,24,22,.06)] md:flex";
  if (indice === 0) {
    return (
      <div className={base} aria-hidden>
        <span className="text-xs text-(--auth-ink-muted)">Hoje, 23:12 · página do imóvel</span>
        <span className="self-end rounded-2xl rounded-br-sm bg-(--auth-primary) px-3 py-2 text-white">Aceita financiamento?</span>
        <span className="self-start rounded-2xl rounded-bl-sm bg-(--auth-muted) px-3 py-2">Aceita, sim: financiamento e FGTS. Quer visitar amanhã?</span>
      </div>
    );
  }
  if (indice === 1) {
    return (
      <div className={base} aria-hidden>
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-(--auth-primary) text-white">
            <CalendarDays className="size-4" />
          </span>
          <span className="flex flex-col leading-snug">
            <strong className="font-semibold">Nova visita pedida</strong>
            <span className="text-(--auth-ink-muted)">[Dia] · [hora] · financiamento</span>
          </span>
        </div>
        <span className="inline-flex self-start rounded-full bg-(--auth-success-bg) px-2.5 py-0.5 text-[13px] font-medium text-(--auth-success-ink)">Confirmar com um toque</span>
      </div>
    );
  }
  return (
    <div className={base} aria-hidden>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-(--auth-primary-soft) text-(--auth-primary)">
          <Lock className="size-4" />
        </span>
        <span className="flex flex-col leading-snug">
          <strong className="font-semibold">Visível só para você</strong>
          <span className="text-(--auth-ink-muted)">Contato salvo só com consentimento</span>
        </span>
      </div>
    </div>
  );
}

// Lado esquerdo das telas de login: a história do produto em 3 mensagens. Avança sozinho a cada
// 6 s; pausa com o mouse, com o foco dentro do painel e com a aba escondida; não avança com
// movimento reduzido (os pontos continuam trocando).
export function PainelHistoria() {
  const [atual, setAtual] = useState(0);
  const pausado = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!pausado.current && !document.hidden) setAtual((i) => (i + 1) % FRASES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      aria-label="Sobre o Showing"
      className="relative isolate flex flex-col justify-between overflow-hidden bg-(--auth-primary) p-5 text-white md:p-10"
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
      onFocus={() => (pausado.current = true)}
      onBlur={() => (pausado.current = false)}
    >
      <div className="auth-cena absolute inset-0 -z-20 scale-[1.08]" aria-hidden>
        <Image src={urlUnsplash(UNSPLASH.fachada.id, 1400)} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[rgba(11,44,45,.62)]" aria-hidden />

      <div className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight">
        <LogoMarca className="size-[30px]" />
        Showing
      </div>

      <div className="grid">
        {FRASES.map((frase, i) => (
          <div
            key={frase}
            className={cn(
              "col-start-1 row-start-1 flex flex-col gap-5 transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none",
              i === atual ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
            )}
            aria-hidden={i === atual ? undefined : true}
          >
            <h2 className="max-w-[15ch] font-[family-name:var(--font-display)] text-[26px] leading-[1.06] font-bold tracking-[-0.025em] text-balance md:text-[32px] lg:text-[40px]">
              {frase}
            </h2>
            <Cartao indice={i} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Escolher mensagem" className="flex gap-1.5">
          {FRASES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAtual(i)}
              aria-current={i === atual}
              aria-label={`Mensagem ${i + 1} de ${FRASES.length}`}
              className="group flex h-11 min-w-7 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)"
            >
              <span className={cn("block h-1 rounded-full transition-[width,background-color] duration-300", i === atual ? "w-8 bg-(--auth-accent)" : "w-3.5 bg-white/40")} />
            </button>
          ))}
        </div>
        <span className="hidden items-center gap-2 text-sm text-(--auth-on-primary-muted) md:flex">
          <ShieldCheck className="size-4" aria-hidden />
          O assistente responde só com o que você cadastrou.
        </span>
      </div>
    </aside>
  );
}
