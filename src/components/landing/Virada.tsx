"use client";

import { limitar, suave, useSecao, useMovimentoReduzido } from "./use-secao";

const PALAVRAS = "E se o imóvel respondesse por você?".split(" ");
const mistura = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

// A virada: o fundo passa de escuro para branco e a frase aparece palavra por palavra.
export function Virada() {
  const reduzido = useMovimentoReduzido();
  const { ref, entrada } = useSecao<HTMLElement>();
  const vp = reduzido ? 1 : entrada;
  const mover = !reduzido;
  const tv = limitar(vp * 1.2);

  return (
    <section
      ref={ref}
      data-tom="claro"
      className="flex min-h-svh items-center"
      style={{ background: `rgb(${mistura(17, 255, tv)},${mistura(24, 255, tv)},${mistura(22, 255, tv)})`, color: tv > 0.5 ? "#111816" : "#ffffff" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-24 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-[40px] leading-[1.02] font-bold tracking-[-0.03em] sm:text-[52px] lg:text-[64px]">
          {PALAVRAS.map((t, i) => {
            const p = limitar(vp * 2 - i * 0.12);
            return (
              <span
                key={t}
                className={`inline-block ${t === "imóvel" ? "text-(--auth-primary)" : ""}`}
                style={{ opacity: p, transform: `translateY(${mover ? (1 - suave(p)) * 30 : 0}px)` }}
              >
                {t}&nbsp;
              </span>
            );
          })}
        </h2>
        <p className="max-w-[56ch] text-lg text-(--auth-ink-muted) lg:text-xl" style={{ opacity: limitar(vp * 2 - 1) }}>
          Cada imóvel ganha uma página com um assistente que conhece a ficha de cor. Ele tira as dúvidas, oferece os seus horários e só chama você quando vale a pena.
        </p>
      </div>
    </section>
  );
}
