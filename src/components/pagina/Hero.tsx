"use client";

import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { AMPLITUDE, limitar, useAnima, useRolagem, type Preset } from "@/components/motion/use-secao";
import { BotaoAgendar, BotaoConversar } from "./botoes";

type Props = {
  id: string;
  titulo: string;
  foto: { src: string; alt: string };
  etiqueta: string;
  preco: string;
  custos: string | null;
  movimento: Preset;
  vendido: boolean;
};

// Chegada: foto em tela cheia, título que aparece palavra por palavra (só CSS, funciona sem JavaScript)
// e cartão de preço. Ao rolar, a foto aproxima e o texto sobe (só com JavaScript e sem "reduzir movimento").
export function Hero({ id, titulo, foto, etiqueta, preco, custos, movimento, vendido }: Props) {
  const { y, vh } = useRolagem();
  const anima = useAnima();
  const k = anima ? AMPLITUDE[movimento] : 0;
  const hp = anima ? limitar(y / vh) : 0;

  return (
    <section id={id} data-tom="escuro" data-capitulo="Chegada" className="relative flex min-h-svh items-end overflow-hidden bg-(--auth-escuro) text-white">
      <Image
        src={foto.src}
        alt={foto.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ transformOrigin: "55% 60%", transform: `scale(${1.04 + 0.16 * hp * k}) translateY(${hp * 60 * k}px)` }}
      />
      <div className="absolute inset-0 bg-[rgba(17,24,22,.4)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[rgba(17,24,22,.55)] to-transparent" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-6 pt-32 pb-24 lg:grid-cols-[1fr_340px] lg:items-end">
        <div className="flex flex-col gap-4.5" style={{ opacity: 1 - limitar(hp * 1.5), transform: `translateY(${-hp * 160 * k}px)` }}>
          <span className="text-sm font-medium tracking-[0.08em] uppercase opacity-85">{etiqueta}</span>
          <h1 className="max-w-[12ch] font-[family-name:var(--font-display)] text-[44px] leading-[0.98] font-bold tracking-[-0.035em] text-balance sm:text-[64px] lg:text-[84px]">
            {titulo.split(" ").map((p, i) => (
              <span key={`${p}-${i}`} className="pg-palavra mr-[0.25em]" style={{ animationDelay: `${i * 110}ms` }}>
                {p}
              </span>
            ))}
          </h1>
        </div>

        <div className="pg-surge flex flex-col gap-1 rounded-3xl bg-white p-6 text-(--auth-ink) shadow-[0_24px_48px_-16px_rgba(17,24,22,.4)]" style={{ animationDelay: "900ms", opacity: 1 - limitar(hp * 1.8) }}>
          <span className="text-[13px] text-(--auth-ink-muted)">Preço</span>
          <span className="font-[family-name:var(--font-display)] text-[34px] leading-[1.1] font-bold">{preco}</span>
          {custos && <span className="text-sm text-(--auth-ink-muted)">{custos}</span>}
          {vendido ? (
            <p className="mt-2 rounded-xl bg-(--auth-muted) px-3 py-2 text-sm font-medium">Este imóvel foi vendido.</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <BotaoAgendar className="flex-1" />
              <BotaoConversar className="border border-(--auth-line-strong) text-(--auth-primary) hover:bg-(--auth-muted)">Perguntar</BotaoConversar>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 hidden flex-col items-center gap-1.5 text-[13px] sm:flex" style={{ opacity: limitar(1 - hp * 4) }} aria-hidden>
        Role para conhecer o imóvel
        <ArrowDown className="size-5" />
      </div>
    </section>
  );
}
