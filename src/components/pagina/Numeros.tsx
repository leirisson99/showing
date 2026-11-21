"use client";

import { AMPLITUDE, limitar, suave, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";

type Props = { id: string; indice: number; titulo: string; itens: { valor: number; rotulo: string }[]; movimento: Preset };

// Três números grandes que contam até o valor quando a seção chega na tela. Sem JavaScript, já aparecem prontos.
export function Numeros({ id, indice, titulo, itens, movimento }: Props) {
  const { ref, entrada } = useSecao<HTMLElement>();
  const anima = useAnima();
  const k = AMPLITUDE[movimento];
  const np = anima ? entrada : 1;

  return (
    <section ref={ref} id={id} data-tom="claro" data-capitulo="A casa" className="flex items-center py-20 lg:min-h-[720px]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16">
        <div style={{ opacity: np, transform: `translateY(${(1 - suave(np)) * 40 * k}px)` }}>
          <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · A casa</span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[36px] leading-[1.04] font-bold tracking-[-0.025em] text-balance lg:text-[52px]">{titulo}</h2>
        </div>
        <ul className="grid grid-cols-3 gap-4">
          {itens.map((n, i) => {
            const p = anima ? limitar(np * 1.6 - i * 0.22) : 1;
            return (
              <li key={n.rotulo} className="flex flex-col gap-2.5 border-t-2 border-(--auth-primary) px-1 py-7 sm:px-6" style={{ opacity: p, transform: `translateY(${(1 - suave(p)) * 60 * k}px)` }}>
                <span className="font-[family-name:var(--font-display)] text-[44px] leading-none font-bold tracking-[-0.04em] text-(--auth-primary) sm:text-[64px] lg:text-[84px]">
                  {Math.round(n.valor * (anima ? suave(p) : 1))}
                </span>
                <span className="text-base text-(--auth-ink-muted) lg:text-lg">{n.rotulo}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
