"use client";

import { useEffect, useRef } from "react";

// Controlador da história rolável da página inicial. Só escreve duas coisas no elemento:
//   --sp     progresso da rolagem (0 a 1), suavizado
//   data-fase  qual cena está ativa (pagina, atendente, visita)
// Todo o movimento é calculado no CSS (globals.css, "história da página inicial").
// Sem JavaScript, ou com "reduzir movimento", o atributo data-ativo nunca é posto e a
// página aparece como uma sequência normal de seções, com todo o conteúdo no HTML.

const FASES: [number, string][] = [
  [0.355, "pagina"],
  [0.715, "atendente"],
  [Infinity, "visita"],
];

const fasePara = (p: number) => FASES.find(([limite]) => p < limite)![1];

export function HistoriaScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let alvo = 0;
    let atual = 0;
    let quadro = 0;

    const aplicar = () => {
      el.style.setProperty("--sp", atual.toFixed(4));
      el.dataset.fase = fasePara(atual);
    };

    const medir = () => {
      const total = el.offsetHeight - window.innerHeight;
      alvo = total > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)) : 0;
    };

    const passo = () => {
      atual += (alvo - atual) * 0.14;
      if (Math.abs(alvo - atual) < 0.0005) atual = alvo;
      aplicar();
      quadro = atual === alvo ? 0 : requestAnimationFrame(passo);
    };

    const aoRolar = () => {
      medir();
      if (!quadro) quadro = requestAnimationFrame(passo);
    };

    el.dataset.ativo = "";
    medir();
    atual = alvo;
    aplicar();

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
      delete el.dataset.ativo;
      delete el.dataset.fase;
      el.style.removeProperty("--sp");
    };
  }, []);

  return (
    <section ref={ref} id="como-funciona" className="historia" aria-label="Como o Showing funciona">
      {children}
    </section>
  );
}
