"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMarca } from "@/components/brand/Logo";
import { useProgressoDaPagina, useRolagem } from "@/components/motion/use-secao";

const MENU = [
  ["O problema", "#problema"],
  ["Experimente", "#experimente"],
  ["Benefícios", "#beneficios"],
  ["Como funciona", "#como-funciona"],
] as const;

// Cabeçalho fixo: fundo branco sobre as seções claras, transparente com texto branco sobre as escuras
// (cada seção diz o seu tom em data-tom). A barra fina embaixo mostra o quanto da página já foi lida.
export function Cabecalho() {
  const { y } = useRolagem();
  const progresso = useProgressoDaPagina();
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const secao = [...document.querySelectorAll<HTMLElement>("[data-tom]")].find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= 40 && r.bottom > 40;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o tom depende da posição de rolagem
    setEscuro(secao?.dataset.tom === "escuro");
  }, [y]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-[background-color,color] duration-300 ${escuro ? "bg-transparent text-white" : "bg-white/92 text-(--auth-ink) shadow-[0_1px_0_var(--auth-line)]"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" aria-label="Showing, início" className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[22px] font-bold tracking-tight">
          <LogoMarca className="size-7" />
          Showing
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1">
          {MENU.map(([t, href]) => (
            <a key={href} href={href} className="hidden min-h-11 items-center rounded px-3 text-[15px] opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent) lg:inline-flex">
              {t}
            </a>
          ))}
          <Link href="/login" className="inline-flex min-h-11 items-center rounded px-3.5 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)">
            Entrar
          </Link>
        </nav>
      </div>
      <div className="h-0.5" aria-hidden>
        <div className="h-full" style={{ width: `${Math.round(progresso * 100)}%`, background: escuro ? "#f2a65a" : "#0f3d3e" }} />
      </div>
    </header>
  );
}
