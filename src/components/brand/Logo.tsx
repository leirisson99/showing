import { cn } from "@/lib/utils";

// Marca do Showing: um balão de conversa em forma de casa, com a porta acesa em ouro.
// A mesma arte está em src/app/icon.svg (favicon). Porta em ouro (#C9A66B); nome em Cormorant Garamond. Regras de uso: docs/identidade-visual.md.

export function LogoMarca({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M7 3h18a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H15l-6.5 5v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z"
        fill="currentColor"
      />
      <path d="M9 16.5 16 10l7 6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 15.5V21h10v-5.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14.4" y="16.6" width="3.2" height="4.4" rx="1" fill="#C9A66B" />
    </svg>
  );
}

export function Logo({ className, marcaClassName }: { className?: string; marcaClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-serif text-2xl leading-none font-semibold tracking-wide", className)}>
      <LogoMarca className={marcaClassName} />
      Showing
    </span>
  );
}
