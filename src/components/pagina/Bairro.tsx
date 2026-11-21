"use client";

import { AMPLITUDE, limitar, suave, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";

type Props = {
  id: string;
  indice: number;
  titulo: string;
  local: string;
  endereco: string;
  itens: { item: string; valor: string }[];
  /** Mapa real (quando há coordenadas). Sem ele, uma região aproximada desenhada. */
  mapa: React.ReactNode;
  movimento: Preset;
};

// O bairro: região aproximada (RN-05: sem endereço nem ponto exato se o corretor não liberou) e o que há por perto.
export function Bairro({ id, indice, titulo, local, endereco, itens, mapa, movimento }: Props) {
  const { ref, entrada } = useSecao<HTMLElement>();
  const anima = useAnima();
  const k = AMPLITUDE[movimento];
  const bp = anima ? entrada : 1;

  return (
    <section ref={ref} id={id} data-tom="claro" data-capitulo="Bairro" className="flex items-center py-20 lg:min-h-[820px]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <div className="relative h-80 overflow-hidden rounded-[28px] bg-[#e6ebe9] lg:h-[520px]">
          {mapa ?? (
            <>
              <div
                aria-hidden
                className="absolute -inset-[60px]"
                style={{
                  backgroundImage: "linear-gradient(#d6dedb 1px, transparent 1px), linear-gradient(90deg, #d6dedb 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                  transform: `scale(${1.8 - 0.8 * suave(bp) * (k > 0 ? 1 : 0) - (k > 0 ? 0 : 0.8)}) rotate(${(1 - suave(bp)) * 8 * k}deg)`,
                }}
              />
              <div aria-hidden className="absolute top-1/2 left-1/2 -mt-[110px] -ml-[110px] size-[220px] rounded-full border-2 border-(--auth-primary) bg-[rgba(15,61,62,.16)]" style={{ transform: `scale(${1 + 1.6 * (1 - suave(bp)) * k})`, opacity: limitar(bp * 1.4) }} />
              <span className="absolute bottom-5 left-5 rounded-full border border-(--auth-line) bg-white px-3.5 py-1.5 text-sm" style={{ opacity: limitar(bp * 2 - 1) }}>
                Região aproximada
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div style={{ opacity: bp, transform: `translateY(${(1 - suave(bp)) * 40 * k}px)` }}>
            <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · O bairro</span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[36px] leading-[1.04] font-bold tracking-[-0.025em] text-balance lg:text-[52px]">{titulo}</h2>
            <p className="mt-3 text-(--auth-ink-muted)">
              {local}. {endereco}
            </p>
          </div>
          {itens.length > 0 && (
            <ul className="flex flex-col">
              {itens.map((b, i) => {
                const p = anima ? limitar(bp * 1.8 - 0.5 - i * 0.16) : 1;
                return (
                  <li key={b.item} className="flex justify-between gap-4 border-b border-(--auth-line) py-4 text-[17px]" style={{ opacity: p, transform: `translateX(${(1 - p) * 30 * k}px)` }}>
                    <span>{b.item}</span>
                    <span className="text-right text-(--auth-ink-muted)">{b.valor}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
