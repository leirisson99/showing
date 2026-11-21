"use client";

import { MessageCircle } from "lucide-react";
import { abrirChat } from "@/components/chat-bubble/eventos";
import { AMPLITUDE, limitar, suave, useAnima, useSecao, type Preset } from "@/components/motion/use-secao";
import { BotaoConversar } from "./botoes";

type Props = {
  id: string;
  indice: number;
  titulo: string;
  perguntas: { rotulo: string; pergunta: string }[];
  corretor: string;
  fotoCorretor: string | null;
  movimento: Preset;
  vendido: boolean;
};

const AGENDAR = "Quero agendar uma visita";

// Dúvidas: cartões de pergunta que abrem o chat já com a pergunta. As respostas vêm do atendente, com a ficha.
export function Duvidas({ id, indice, titulo, perguntas, corretor, fotoCorretor, movimento, vendido }: Props) {
  const { ref, entrada } = useSecao<HTMLElement>();
  const anima = useAnima();
  const k = AMPLITUDE[movimento];
  const dp = anima ? entrada : 1;

  return (
    <section ref={ref} id={id} data-tom="claro" data-capitulo="Dúvidas" className="flex items-center bg-(--auth-claro) py-20 lg:min-h-[820px]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-3.5">
          <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · Dúvidas</span>
          <h2 className="font-[family-name:var(--font-display)] text-[36px] leading-[1.04] font-bold tracking-[-0.025em] text-balance lg:text-[52px]">{titulo}</h2>
          {vendido ? (
            <p className="text-(--auth-ink-muted)">Este imóvel foi vendido e o atendente não está mais respondendo sobre ele.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {perguntas.map((p, i) => {
                const q = anima ? limitar(dp * 1.8 - i * 0.2) : 1;
                return (
                  <li key={p.rotulo} style={{ opacity: q, transform: `translateY(${(1 - suave(q)) * 40 * k}px)` }}>
                    <button
                      type="button"
                      onClick={() => (p.pergunta === AGENDAR ? abrirChat("agendamento") : abrirChat("conversa", p.pergunta))}
                      className="flex min-h-24 w-full flex-col items-start gap-1.5 rounded-2xl border border-(--auth-line) bg-white p-4 text-left transition-[border-color,background-color] hover:border-(--auth-primary) hover:bg-(--auth-primary-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary)"
                    >
                      <span className="text-xs font-medium tracking-[0.04em] text-(--auth-ink-muted) uppercase">{p.rotulo}</span>
                      <span className="text-base font-semibold">{p.pergunta}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!vendido && (
          <div
            className="flex flex-col gap-5 rounded-[28px] border border-(--auth-line) bg-white p-6 shadow-[0_24px_48px_-24px_rgba(17,24,22,.25)]"
            style={{ opacity: limitar(dp * 1.4), transform: `translateY(${(1 - suave(dp)) * 60 * k}px) scale(${1 - (1 - suave(dp)) * 0.04 * k})` }}
          >
            <div className="flex items-center gap-3">
              {fotoCorretor ? (
                // eslint-disable-next-line @next/next/no-img-element -- foto do corretor já otimizada no cartão; aqui é um avatar de 44 px
                <img src={fotoCorretor} alt="" className="size-11 rounded-full object-cover" />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-full bg-(--auth-primary) font-semibold text-white" aria-hidden>
                  {corretor.slice(0, 1)}
                </span>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">Assistente de {corretor}</span>
                <span className="text-sm text-(--auth-ink-muted)">Responde na hora, com os dados do imóvel</span>
              </div>
            </div>
            <p className="rounded-[20px] rounded-bl-sm bg-(--auth-muted) px-3.5 py-2.5">Oi! Toque numa pergunta ao lado ou escreva a sua.</p>
            <BotaoConversar className="gap-2 self-start bg-(--auth-primary) text-white hover:bg-(--auth-primary-deep)">
              <MessageCircle className="size-[18px]" aria-hidden /> Abrir a conversa
            </BotaoConversar>
          </div>
        )}
      </div>
    </section>
  );
}
