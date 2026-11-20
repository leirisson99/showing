"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Atraso antes de aparecer, em ms. */
  delay?: number;
  /** Duração da transição, em ms. */
  duration?: number;
  className?: string;
  children: React.ReactNode;
};

// Aparece com fade depois de `delay`. Com "reduzir movimento" aparece de uma vez.
export function FadeIn({ delay = 0, duration = 1000, className, children }: Props) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setVisivel(true), reduzir ? 0 : delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  return (
    <div
      className={cn("hero-anim transition-opacity motion-reduce:transition-none", className)}
      style={{ opacity: visivel ? 1 : 0, transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
