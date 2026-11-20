"use client";

import { limitar, suave, useSecao, useMovimentoReduzido } from "./use-secao";

const PASSOS = [
  ["1", "Envie as fotos", "Pelo celular, com os dados do imóvel. Leva poucos minutos."],
  ["2", "Revise a página", "Texto, fotos e perguntas prontas. Você ajusta e publica."],
  ["3", "Receba visitas", "Compartilhe o link. O assistente atende e você recebe os pedidos."],
] as const;

export function Passos() {
  const reduzido = useMovimentoReduzido();
  const { ref, entrada } = useSecao<HTMLElement>();
  const pp = reduzido ? 1 : entrada;
  const mover = !reduzido;

  return (
    <section ref={ref} id="como-funciona" data-tom="claro" className="bg-white py-20 lg:flex lg:min-h-[900px] lg:items-center">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-ink-muted) uppercase">Como funciona</span>
          <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.08] font-bold tracking-[-0.02em] lg:text-[44px]">Das fotos à visita, em três passos.</h2>
        </div>
        <div className="relative">
          <div className="absolute top-[31px] right-[16.6%] left-[16.6%] hidden h-[3px] rounded-full bg-(--auth-line) lg:block" aria-hidden>
            <div className="h-full rounded-full bg-(--auth-primary)" style={{ width: `${Math.round(limitar(pp * 1.3 - 0.15) * 100)}%` }} />
          </div>
          <ol className="relative grid gap-10 lg:grid-cols-3 lg:gap-6">
            {PASSOS.map((s, i) => {
              const p = limitar(pp * 1.6 - i * 0.35);
              const on = p > 0.6;
              return (
                <li key={s[0]} className="flex flex-col items-center gap-3.5 text-center" style={{ opacity: p, transform: `translateY(${mover ? (1 - suave(p)) * 30 : 0}px)` }}>
                  <span
                    className={`flex size-16 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-2xl font-bold transition-[background-color,color] duration-300 ${on ? "bg-(--auth-primary) text-white" : "box-border border-2 border-[#c5cfcc] bg-white text-(--auth-primary)"}`}
                  >
                    {s[0]}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-[22px] font-semibold">{s[1]}</h3>
                  <p className="max-w-[30ch] text-(--auth-ink-muted)">{s[2]}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
