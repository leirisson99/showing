"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/painel", rotulo: "Visão geral", exato: true },
  { href: "/painel/imoveis", rotulo: "Imóveis", exato: false },
  { href: "/painel/visitas", rotulo: "Visitas", exato: false },
  { href: "/painel/conversas", rotulo: "Conversas", exato: false },
  { href: "/painel/clientes", rotulo: "Clientes", exato: false },
  { href: "/painel/perfil", rotulo: "Perfil", exato: false },
];

export function NavPainel({ pendentes = 0, admin = false }: { pendentes?: number; admin?: boolean }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Painel" className="relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:pb-0">
      {(admin ? [...LINKS, { href: "/painel/admin", rotulo: "Admin", exato: false }] : LINKS).map(({ href, rotulo, exato }) => {
        const ativo = exato ? caminho === href : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              ativo && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {rotulo}
            {href === "/painel/conversas" && pendentes > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-xs font-semibold text-cta-foreground">
                {pendentes}
                <span className="sr-only"> conversas esperando resposta</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
