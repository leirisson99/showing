"use client";

import { useState } from "react";

const SEM = [
  ["07:10", "Acorda com mensagens da madrugada sem resposta.", "Atrasado"],
  ["12:30", "Repete preço e condomínio para mais um interessado.", "Repetido"],
  ["15:00", "Combina horário de visita por mensagem, ida e volta.", "Demorado"],
  ["22:40", "Uma pergunta chega e fica para amanhã.", "Perdido"],
] as const;

const COM = [
  ["07:10", "O assistente já respondeu quem perguntou de madrugada.", "Resolvido"],
  ["12:30", "Você recebe só a visita pedida, com o resumo do comprador.", "Pronto"],
  ["15:00", "Confirma a visita com um toque, entre um compromisso e outro.", "Rápido"],
  ["22:40", "O comprador tira as dúvidas e marca a visita sozinho.", "Agendado"],
] as const;

// O mesmo dia, de dois jeitos. Abas de verdade (setas do teclado trocam).
export function Comparacao() {
  const [com, setCom] = useState(false);
  const dia = com ? COM : SEM;

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setCom((c) => !c);
    }
  }

  const aba = (sel: boolean) =>
    `min-h-11 rounded-full px-5 text-[15px] font-semibold transition-[background-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary) ${sel ? "bg-(--auth-primary) text-white" : "text-(--auth-ink-muted)"}`;

  return (
    <section id="comparacao" data-tom="claro" className="bg-(--auth-claro) py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-7 px-6">
        <h2 className="text-center font-[family-name:var(--font-display)] text-[32px] leading-[1.08] font-bold tracking-[-0.02em] lg:text-[44px]">O mesmo dia, de dois jeitos.</h2>
        <div role="tablist" aria-label="Comparar o dia" onKeyDown={teclas} className="inline-flex gap-1 rounded-full bg-(--auth-line) p-1">
          <button type="button" role="tab" id="aba-sem" aria-selected={!com} aria-controls="painel-dia" tabIndex={com ? -1 : 0} onClick={() => setCom(false)} className={aba(!com)}>
            Sem Showing
          </button>
          <button type="button" role="tab" id="aba-com" aria-selected={com} aria-controls="painel-dia" tabIndex={com ? 0 : -1} onClick={() => setCom(true)} className={aba(com)}>
            Com Showing
          </button>
        </div>
        <div id="painel-dia" role="tabpanel" aria-labelledby={com ? "aba-com" : "aba-sem"} className="w-full">
          <ul className="flex w-full flex-col gap-3">
            {dia.map((h) => (
            <li key={h[0]} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[20px] border border-(--auth-line) bg-white px-6 py-5">
              <span className="min-w-16 font-[family-name:var(--font-display)] text-xl font-bold">{h[0]}</span>
              <span className="min-w-48 grow text-[17px]">{h[1]}</span>
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap ${com ? "bg-(--auth-success-bg) text-(--auth-success-ink)" : "bg-[#fdecea] text-[#8a1c12]"}`}>{h[2]}</span>
            </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
