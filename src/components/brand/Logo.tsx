import { cn } from "@/lib/utils";

// Marca do Showing (logo/Logo.png, opção B): duas bolhas de conversa, a de cima na cor do texto
// (currentColor, vira branca sobre fundo escuro) e a de baixo em laranja.
// A mesma arte está em src/app/icon.svg (favicon). Regras de uso: docs/identidade-visual.md.

export function LogoMarca({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 143 143"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M33 0H77A33 33 0 0 1 110 33A33 33 0 0 1 77 66H4A4 4 0 0 1 0 62V33A33 33 0 0 1 33 0Z" fill="currentColor" />
      <path d="M66 77H110A33 33 0 0 1 143 110V139A4 4 0 0 1 139 143H66A33 33 0 0 1 33 110A33 33 0 0 1 66 77Z" fill="#F2A65A" />
    </svg>
  );
}

export function Logo({ className, marcaClassName }: { className?: string; marcaClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-2xl leading-none font-extrabold tracking-tight", className)}>
      <LogoMarca className={marcaClassName} />
      Showing
    </span>
  );
}
