"use client";

import Image from "next/image";
import { AMPLITUDE, limitar, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";

type Quadro = { src: string; alt: string; rotulo: string; frase: string };
type Props = { id: string; indice: number; quadros: Quadro[]; movimento: Preset };

// Ambientes: com JavaScript, uma tela fixa onde as fotos trocam enquanto você rola (uma frase por ambiente).
// Sem JavaScript, ou com "reduzir movimento", vira uma lista de blocos, cada um com foto e frase.
export function Ambientes({ id, indice, quadros, movimento }: Props) {
  const { ref, progresso: ap } = useSecao<HTMLElement>();
  const cena = useAnima();
  const k = AMPLITUDE[movimento];
  const n = quadros.length;

  if (!cena) {
    return (
      <section id={id} data-tom="claro" data-capitulo="Ambientes" className="bg-(--auth-claro) py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
          <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · Os ambientes</span>
          {quadros.map((q) => (
            <figure key={q.src} className="grid items-center gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-(--auth-muted)">
                <Image src={q.src} alt={q.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="flex flex-col gap-2">
                <span className="text-sm text-(--auth-ink-muted)">{q.rotulo}</span>
                <p className="font-[family-name:var(--font-display)] text-[28px] leading-[1.1] font-bold tracking-[-0.02em] lg:text-[36px]">{q.frase}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  const ativo = Math.min(n - 1, Math.floor(ap * n));
  return (
    <section ref={ref} id={id} data-tom="escuro" data-capitulo="Ambientes" className="relative bg-(--auth-escuro)" style={{ height: `${100 + n * 90}svh` }}>
      <div className="sticky top-0 grid h-svh grid-rows-[52%_48%] overflow-hidden text-white lg:grid-cols-[1.5fr_1fr] lg:grid-rows-1">
        <div className="relative overflow-hidden">
          {quadros.map((q, i) => {
            const d = ap * (n - 1) - i;
            return (
              <Image
                key={q.src}
                src={q.src}
                alt={q.alt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                style={{ opacity: limitar(1 - Math.abs(d) * 1.4), transform: `scale(${1.14 - 0.14 * limitar(1 - Math.abs(d)) * k}) translateX(${d * -40 * k}px)` }}
                aria-hidden={i === ativo ? undefined : true}
              />
            );
          })}
        </div>
        <div className="relative flex flex-col justify-between gap-6 px-6 pt-8 pb-8 lg:px-14 lg:pt-28 lg:pb-16">
          <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-accent) uppercase">Capítulo {indice} · Os ambientes</span>
          <div className="relative h-36 lg:h-72">
            {quadros.map((q, i) => {
              const d = ap * (n - 1) - i;
              return (
                <div key={q.src} className="absolute inset-x-0 top-0 flex flex-col gap-3.5" style={{ opacity: limitar(1 - Math.abs(d) * 2.2), transform: `translateY(${d * -70 * k}px)` }} aria-hidden={i === ativo ? undefined : true}>
                  <span className="text-sm text-(--auth-on-primary-muted)">{q.rotulo}</span>
                  <p className="font-[family-name:var(--font-display)] text-[26px] leading-[1.06] font-bold tracking-[-0.025em] lg:text-[44px]">{q.frase}</p>
                </div>
              );
            })}
          </div>
          <ol className="flex flex-col gap-2.5 pr-16 lg:pr-0">
            {quadros.map((q, i) => {
              const local = limitar(ap * n - i);
              const on = i === ativo;
              return (
                <li key={q.src} className="flex items-center gap-3 text-sm">
                  <span className={`w-7 font-[family-name:var(--font-display)] font-bold ${on ? "text-(--auth-accent)" : "text-white/50"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20" aria-hidden>
                    <span className="block h-full rounded-full bg-(--auth-accent)" style={{ width: `${Math.round(local * 100)}%` }} />
                  </span>
                  <span className={`w-24 truncate text-right sm:w-28 ${on ? "font-semibold text-white" : "text-white/55"}`}>{q.rotulo}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
