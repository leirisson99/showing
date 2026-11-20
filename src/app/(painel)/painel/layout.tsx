import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { NavPainel } from "@/components/painel/NavPainel";
import { exigirCorretor } from "@/lib/session";
import { sair } from "./actions";

export default function PainelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      <header className="px-4 pt-4">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 rounded-2xl bg-card px-4 py-2 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/painel" aria-label="Showing, visão geral do painel" className="text-primary">
              <Logo marcaClassName="size-7" />
            </Link>
            <Suspense fallback={null}>
              <NavPainel />
            </Suspense>
          </div>
          <form action={sair}>
            <Button type="submit" variant="ghost" className="h-11 rounded-full px-4">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <Suspense fallback={<p className="p-6 text-muted-foreground">Carregando…</p>}>
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
