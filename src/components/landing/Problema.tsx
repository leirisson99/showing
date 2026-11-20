"use client";

import { limitar, suave, useSecao, useMovimentoReduzido } from "./use-secao";

const FRASES = ["Pergunta às 23h, no meio do jantar.", "A mesma dúvida pela décima vez na semana.", "E o comprador que esfriou enquanto você dirigia."];

// Mensagens de exemplo, para mostrar o problema. Não são de pessoas reais.
const NOTAS = [
  ["M", "Marina", "23:12", "Ainda está disponível?"],
  ["C", "Carlos", "06:40", "Aceita financiamento?"],
  ["V", "Visitante", "09:15", "Qual o valor do condomínio?"],
  ["P", "Paula", "11:02", "Tem vaga de garagem?"],
  ["R", "Rafael", "14:37", "Oi? Alguém aí?"],
  ["M", "Marina", "18:20", "Deixa, achei outro."],
] as const;

// "O problema": seção escura que fica na tela enquanto as frases trocam e as mensagens se acumulam.
// Com movimento reduzido, tudo aparece de uma vez, em lista.
export function Problema() {
  const reduzido = useMovimentoReduzido();
  const { ref, progresso: dp } = useSecao<HTMLElement>();
  const mover = !reduzido;
  const T = (px: number) => (mover ? px : 0);

  return (
    <section ref={ref} id="problema" data-tom="escuro" className={`relative bg-(--auth-escuro) text-white ${mover ? "h-[300svh]" : ""}`}>
      <div className={mover ? "sticky top-0 flex h-svh items-center overflow-hidden" : "py-24"}>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className={`relative ${mover ? "h-60 lg:h-80" : ""}`}>
            <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-accent) uppercase">O problema</span>
            {FRASES.map((t, k) => {
              // A primeira frase já está inteira quando a seção gruda na tela.
              const d = k === 0 ? Math.max(0, dp * 3 - 0.5) : dp * 3 - k - 0.5;
              return (
                <p
                  key={t}
                  className={`${mover ? "absolute inset-x-0 top-12" : "mt-4"} m-0 font-[family-name:var(--font-display)] text-[32px] leading-[1.08] font-bold tracking-[-0.025em] sm:text-[40px] lg:text-5xl`}
                  style={mover ? { opacity: limitar(1 - Math.abs(d) * 1.8), transform: `translateY(${T(d * -50)}px)` } : undefined}
                >
                  {t}
                </p>
              );
            })}
          </div>
          <div className={`relative flex flex-col justify-center gap-2.5 ${mover ? "lg:h-160" : ""}`}>
            {NOTAS.map((n, i) => {
              const p = mover ? limitar(dp * 7 - i - 0.3) : 1;
              const ultima = i === NOTAS.length - 1;
              return (
                <div
                  key={`${n[1]}-${n[2]}`}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${ultima ? "border-[#8a1c12] bg-[#3a1a14]" : "border-[#2b3532] bg-[#1d2a27]"} ${mover ? "max-lg:hidden max-lg:data-[ver=true]:flex" : ""}`}
                  data-ver={mover ? dp > 0.2 + i * 0.1 : true}
                  style={{ opacity: p, transform: `translateY(${T((1 - suave(p)) * 40)}px) scale(${mover ? 0.96 + 0.04 * suave(p) : 1})` }}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2b3532] text-[13px] font-semibold">{n[0]}</span>
                  <div className="flex min-w-0 grow flex-col leading-snug">
                    <span className="flex justify-between gap-2 text-[13px] text-[#9fb3af]">
                      <span>{n[1]}</span>
                      <span>{n[2]}</span>
                    </span>
                    <span className="text-[15px]">{n[3]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
