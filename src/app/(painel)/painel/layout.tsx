import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { EsqueletoPagina } from "@/components/painel/Esqueletos";
import { NavPainel } from "@/components/painel/NavPainel";
import { exigirCorretor } from "@/lib/session";
import { sair } from "./actions";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      <header className="px-4 pt-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-card px-4 py-2 ring-1 ring-foreground/10">
          <Link href="/painel" aria-label="Showing, visão geral do painel" className="order-1 text-primary">
            <Logo marcaClassName="size-7" />
          </Link>
          {/* No celular o menu desce para uma segunda linha e rola na horizontal. */}
          <div className="order-3 w-full min-w-0 md:order-2 md:w-auto md:flex-1">
            <Suspense fallback={null}>
              <NavPainel />
            </Suspense>
          </div>
          <form action={sair} className="order-2 md:order-3">
            <Button type="submit" variant="ghost" className="h-11 rounded-full px-4">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <Suspense fallback={<EsqueletoPagina />}>
        <Protegido>{children}</Protegido>
      </Suspense>
    </>
  );
}

// A sessão é conferida aqui também, além do proxy.
async function Protegido({ children }: { children: React.ReactNode }) {
  await exigirCorretor();
  return children;
}
