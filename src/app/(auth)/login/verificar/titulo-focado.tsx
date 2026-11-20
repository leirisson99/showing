"use client";

import { useEffect, useRef } from "react";

// Ao chegar em "Veja seu e-mail", o foco vai para o título (leitor de tela anuncia a mudança).
export function TituloFocado({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className="font-[family-name:var(--font-display)] text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance outline-none md:text-[32px]"
    >
      {children}
    </h1>
  );
}
