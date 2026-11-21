"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AMPLITUDE, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";

type Foto = { src: string; alt: string; legenda: string | null };
type Props = { id: string; indice: number; titulo: string; fotos: Foto[]; movimento: Preset };

// Fotos em linha. Com JavaScript, o trilho anda de lado enquanto você rola para baixo; sem JavaScript, ou com
// "reduzir movimento", é uma faixa que você arrasta ou rola com o dedo (com encaixe em cada foto).
export function GaleriaHorizontal({ id, indice, titulo, fotos, movimento }: Props) {
  const { ref, progresso: gp } = useSecao<HTMLElement>();
  const cena = useAnima();
  const k = AMPLITUDE[movimento];
  const janela = useRef<HTMLDivElement>(null);
  const trilho = useRef<HTMLUListElement>(null);
  const [alcance, setAlcance] = useState(0);

  useEffect(() => {
    if (!cena) return;
    const medir = () => {
      if (janela.current && trilho.current) setAlcance(Math.max(0, trilho.current.scrollWidth - janela.current.clientWidth));
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [cena, fotos.length]);

  const centro = gp * (fotos.length - 1);
  const contador = `${String(Math.min(fotos.length, Math.round(centro) + 1)).padStart(2, "0")} / ${String(fotos.length).padStart(2, "0")}`;

  const cabecalho = (
    <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6">
      <div>
        <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · Fotos</span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[36px] leading-[1.04] font-bold tracking-[-0.025em] text-balance lg:text-[52px]">{titulo}</h2>
      </div>
      {cena && <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-(--auth-ink-muted)">{contador}</span>}
    </div>
  );

  const quadro = (f: Foto, i: number) => {
    const dist = cena ? Math.abs(i - centro) : 0;
    const d = Math.min(dist, 1.5);
    return (
      <li key={f.src} className="flex shrink-0 snap-center flex-col gap-3" style={cena ? { transform: `scale(${1 - d * 0.05 * k}) translateY(${d * 16 * k}px)`, opacity: 1 - d * 0.25 } : undefined}>
        <figure className="m-0 flex flex-col gap-3">
          <div className="relative size-[72vw] overflow-hidden rounded-3xl bg-(--auth-muted) sm:size-[440px]">
            <Image src={f.src} alt={f.alt} fill sizes="(min-width: 640px) 440px, 72vw" className="object-cover" />
          </div>
          {f.legenda && <figcaption className="text-[17px] font-semibold">{f.legenda}</figcaption>}
        </figure>
      </li>
    );
  };

  if (!cena) {
    return (
      <section id={id} data-tom="claro" data-capitulo="Fotos" className="bg-(--auth-claro) py-20">
        <div className="flex flex-col gap-9">
          {cabecalho}
          <ul className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4" tabIndex={0} aria-label="Fotos do imóvel, role para o lado">
            {fotos.map(quadro)}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id={id} data-tom="claro" data-capitulo="Fotos" className="relative bg-(--auth-claro)" style={{ height: `${100 + fotos.length * 45}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center gap-9 overflow-hidden">
        {cabecalho}
        <div ref={janela} className="overflow-hidden">
          <ul ref={trilho} className="flex w-max gap-6 px-6 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]" style={{ transform: `translateX(${-alcance * gp}px)` }}>
            {fotos.map(quadro)}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6" aria-hidden>
          <div className="h-1 overflow-hidden rounded-full bg-(--auth-line)">
            <div className="h-full rounded-full bg-(--auth-primary)" style={{ width: `${Math.round(gp * 100)}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
