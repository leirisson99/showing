"use client";

import { useEffect, useState } from "react";
import { abrirChat } from "@/components/chat-bubble/eventos";
import { useProgressoDaPagina, useRolagem } from "@/components/motion/use-secao";

type Props = { corretor: string; creci: string; vendido: boolean };

// Barra fixa: quem é o corretor, o capítulo em que você está (clicável) e o quanto da página já foi lida.
// Os capítulos são lidos do próprio HTML (data-capitulo), então o cabeçalho acompanha qualquer roteiro.
export function Cabecalho({ corretor, creci, vendido }: Props) {
  const { y } = useRolagem();
  const progresso = useProgressoDaPagina();
  const [capitulos, setCapitulos] = useState<{ id: string; nome: string }[]>([]);
  const [atual, setAtual] = useState(0);
  const [escuro, setEscuro] = useState(true);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-capitulo]")];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê os capítulos que existem na página depois de montar
    setCapitulos((antes) => (antes.length === els.length ? antes : els.map((el) => ({ id: el.id, nome: el.dataset.capitulo ?? "" }))));
    let a = 0;
    els.forEach((el, i) => {
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.4) a = i;
    });
    setAtual(a);
    const sob = els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= 40 && r.bottom > 40;
    });
    setEscuro(sob?.dataset.tom !== "claro");
  }, [y]);

  const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

  return (
    <header className={`fixed inset-x-0 top-0 z-30 transition-[background-color,color] duration-300 ${escuro ? "bg-transparent text-white" : "bg-white/94 text-(--auth-ink) shadow-[0_1px_0_var(--auth-line)]"}`}>
      <div className="flex items-center justify-between gap-4 px-4 pt-3.5 pb-2.5 sm:px-8">
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-[family-name:var(--font-display)] text-base font-semibold">{corretor}</span>
          <span className="text-xs opacity-75">{creci}</span>
        </span>
        <nav aria-label="Capítulos" className="hidden gap-0.5 lg:flex">
          {capitulos.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => ir(c.id)}
              aria-current={i === atual ? "true" : undefined}
              className={`min-h-11 rounded-full px-3 text-sm transition-[background-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent) ${i === atual ? `font-semibold ${escuro ? "bg-white/18" : "bg-(--auth-primary-soft)"}` : "opacity-70 hover:opacity-100"}`}
            >
              {c.nome}
            </button>
          ))}
        </nav>
        <span className="truncate text-sm font-medium lg:hidden" aria-hidden>
          {capitulos[atual]?.nome}
        </span>
        {!vendido && (
          <button
            type="button"
            onClick={() => abrirChat("conversa")}
            className={`inline-flex h-11 shrink-0 items-center rounded-full px-4.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent) ${escuro ? "bg-white text-(--auth-primary)" : "bg-(--auth-primary) text-white"}`}
          >
            Conversar
          </button>
        )}
      </div>
      <div className={`h-0.5 ${escuro ? "bg-white/20" : "bg-(--auth-line)"}`} aria-hidden>
        <div className="h-full" style={{ width: `${Math.round(progresso * 100)}%`, background: escuro ? "#f2a65a" : "#0f3d3e" }} />
      </div>
    </header>
  );
}
