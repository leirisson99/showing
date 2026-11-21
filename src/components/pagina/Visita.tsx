"use client";

import { AMPLITUDE, limitar, suave, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";
import { BotaoAgendar, BotaoConversar } from "./botoes";

type Props = { id: string; indice: number; titulo: string; corretor: string; creci: string; fotoCorretor: string | null; movimento: Preset; vendido: boolean };

// Chamada final: o corretor e o convite para agendar. Os horários vêm do atendente, que só oferece os livres.
export function Visita({ id, indice, titulo, corretor, creci, fotoCorretor, movimento, vendido }: Props) {
  const { ref, entrada } = useSecao<HTMLElement>();
  const anima = useAnima();
  const k = AMPLITUDE[movimento];
  const cp = anima ? entrada : 1;

  return (
    <section ref={ref} id={id} data-tom="escuro" data-capitulo="Visita" className="flex items-center bg-(--auth-primary) py-20 text-white lg:min-h-[720px]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1fr_360px] lg:gap-16">
        <div className="flex flex-col gap-4.5">
          <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-accent) uppercase">Capítulo {indice} · A visita</span>
          <h2 className="font-[family-name:var(--font-display)] text-[44px] leading-none font-bold tracking-[-0.035em] text-balance sm:text-[60px] lg:text-[72px]" style={{ opacity: cp, transform: `translateY(${(1 - suave(cp)) * 40 * k}px)` }}>
            {titulo}
          </h2>
          <p className="max-w-[42ch] text-[19px] text-(--auth-on-primary-muted)">
            {vendido ? `Este imóvel foi vendido. Fale com ${corretor} sobre outros imóveis.` : `${corretor} mostra o imóvel nos horários que você escolher. É só pedir pelo chat.`}
          </p>
          <div className="mt-2 flex flex-wrap gap-3" style={{ opacity: limitar(cp * 1.5 - 0.4) }}>
            {!vendido && <BotaoAgendar className="h-14 px-8 text-[17px]" />}
            <BotaoConversar className="h-14 border border-white/50 px-6 text-white hover:bg-white/10">{vendido ? "Falar com o corretor" : "Tirar dúvidas"}</BotaoConversar>
          </div>
        </div>
        <div className="flex flex-col gap-3.5 rounded-[28px] border border-white/15 bg-white/6 p-4" style={{ opacity: cp, transform: `translateY(${(1 - suave(cp)) * 80 * k}px) rotate(${(1 - suave(cp)) * 4 * k}deg)` }}>
          {fotoCorretor ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto do corretor, quadrada
            <img src={fotoCorretor} alt={`Foto de ${corretor}`} className="aspect-square w-full rounded-[20px] object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-[20px] bg-white/10 font-[family-name:var(--font-display)] text-7xl font-bold" aria-hidden>
              {corretor.slice(0, 1)}
            </div>
          )}
          <div className="flex flex-col leading-snug">
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold">{corretor}</span>
            <span className="text-sm text-(--auth-on-primary-muted)">{creci}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
