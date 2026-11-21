"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Posição de rolagem de uma seção, para as animações da página de vendas.
//  - `progresso`: 0 a 1 enquanto a seção "gruda" na tela (seção alta com um filho sticky);
//  - `entrada`: 0 a 1 enquanto a seção sobe para dentro da janela (revelar ao chegar).
// Um único ouvinte de rolagem, com requestAnimationFrame, serve todas as seções.

const ouvintes = new Set<() => void>();
let agendado = false;

function agendar() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(() => {
    agendado = false;
    ouvintes.forEach((f) => f());
  });
}

function assinar(f: () => void) {
  if (ouvintes.size === 0) {
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
  }
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
    if (ouvintes.size === 0) {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    }
  };
}

export const limitar = (v: number) => Math.max(0, Math.min(1, v));
export const suave = (t: number) => 1 - Math.pow(1 - t, 3);

const CONSULTA_MOVIMENTO = "(prefers-reduced-motion: reduce)";

/** Usuário pede menos movimento: as seções mostram o estado final, sem depender da rolagem. */
export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CONSULTA_MOVIMENTO);
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA_MOVIMENTO).matches,
    () => false,
  );
}

export function useSecao<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [m, setM] = useState({ progresso: 0, entrada: 0 });

  useEffect(() => {
    const medir = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progresso = Math.round(limitar(-r.top / Math.max(1, r.height - vh)) * 1000) / 1000;
      const entrada = Math.round(limitar((vh - r.top - 100) / (vh * 0.55)) * 1000) / 1000;
      setM((p) => (p.progresso === progresso && p.entrada === entrada ? p : { progresso, entrada }));
    };
    medir();
    return assinar(medir);
  }, []);

  return { ref, ...m };
}

/** Progresso da página inteira (barra do cabeçalho). */
export function useProgressoDaPagina(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const medir = () => {
      const h = document.documentElement;
      const v = Math.round(limitar(window.scrollY / Math.max(1, h.scrollHeight - window.innerHeight)) * 1000) / 1000;
      setP((a) => (a === v ? a : v));
    };
    medir();
    return assinar(medir);
  }, []);
  return p;
}

/** Posição de rolagem da janela e sua altura (hero e cabeçalho). */
export function useRolagem(): { y: number; vh: number } {
  const [r, setR] = useState({ y: 0, vh: 800 });
  useEffect(() => {
    const medir = () => {
      const y = Math.round(window.scrollY);
      const vh = window.innerHeight;
      setR((a) => (a.y === y && a.vh === vh ? a : { y, vh }));
    };
    medir();
    return assinar(medir);
  }, []);
  return r;
}

/** Falso no servidor e na primeira renderização; verdadeiro depois que a página hidrata. Quem anima por rolagem espera isto: sem JavaScript, tudo aparece pronto. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Quanto cada preset de movimento amplia os deslocamentos. `minimo` só mexe na opacidade. */
export const AMPLITUDE = { suave: 1, marcante: 1.7, minimo: 0 } as const;
export type Preset = keyof typeof AMPLITUDE;

/** Animar por rolagem? Só depois de hidratar e se o usuário não pediu menos movimento. */
export function useAnima(): boolean {
  const hidratado = useHidratado();
  const reduzido = useMovimentoReduzido();
  return hidratado && !reduzido;
}
