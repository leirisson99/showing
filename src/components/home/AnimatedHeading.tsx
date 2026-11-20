"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Texto do título; "\n" quebra a linha. */
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** Atraso inicial (ms), atraso entre letras (ms) e duração de cada letra (ms). */
  initialDelay?: number;
  charDelay?: number;
  charDuration?: number;
};

// Título que entra letra por letra (opacidade + deslizamento da esquerda).
// Leitores de tela e buscadores recebem o texto inteiro (sr-only); as letras animadas
// são só visuais (aria-hidden). Cada palavra é um bloco inline, para quebrar a linha
// entre palavras em telas estreitas.
export function AnimatedHeading({ text, className, style, initialDelay = 200, charDelay = 30, charDuration = 500 }: Props) {
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setAtivo(true), reduzir ? 0 : initialDelay);
    return () => window.clearTimeout(id);
  }, [initialDelay]);

  const linhas = text.split("\n");

  return (
    <h1 className={className} style={style}>
      <span className="sr-only">{linhas.join(" ")}</span>
      <span aria-hidden>
        {linhas.map((linha, li) => {
          let i = 0; // posição da letra na linha, contando os espaços
          return (
            <span key={li} className="block">
              {linha.split(" ").map((palavra, pi, palavras) => {
                const letras = [...palavra].map((letra) => {
                  const atraso = li * linha.length * charDelay + i * charDelay;
                  i++;
                  return (
                    <span
                      key={i}
                      className="hero-anim inline-block transition-[opacity,transform] ease-out motion-reduce:transition-none"
                      style={{
                        opacity: ativo ? 1 : 0,
                        transform: ativo ? "translateX(0)" : "translateX(-18px)",
                        transitionDuration: `${charDuration}ms`,
                        transitionDelay: `${atraso}ms`,
                      }}
                    >
                      {letra}
                    </span>
                  );
                });
                i++; // o espaço entre as palavras
                return (
                  <span key={pi}>
                    <span className="inline-block whitespace-nowrap">{letras}</span>
                    {pi < palavras.length - 1 ? " " : null}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </h1>
  );
}
