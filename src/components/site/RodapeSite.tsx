import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

type Coluna = { titulo: string; links: { href: string; rotulo: string }[] };

const COLUNAS: Coluna[] = [
  {
    titulo: "Showing",
    links: [
      { href: "/", rotulo: "Página inicial" },
      { href: "/login", rotulo: "Entrar como corretor" },
    ],
  },
  { titulo: "Institucional", links: [{ href: "/privacidade", rotulo: "Política de privacidade" }] },
];

export function RodapeSite() {
  return (
    <footer className="bg-sand text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3 text-primary">
          <Logo marcaClassName="size-9" />
          <p className="max-w-xs text-sm text-foreground/70">Página exclusiva do imóvel com atendente virtual.</p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-16 gap-y-4 text-sm">
          {COLUNAS.map((c) => (
            <div key={c.titulo} className="flex flex-col gap-2">
              <p className="font-semibold">{c.titulo}</p>
              {c.links.map((l) => (
                <Link key={l.href} href={l.href} className="min-h-6 text-foreground/70 transition-colors hover:text-foreground">
                  {l.rotulo}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-foreground/15">
        <p className="mx-auto w-full max-w-6xl px-5 py-4 text-xs text-foreground/60">Em teste com corretores de Blumenau.</p>
      </div>
    </footer>
  );
}
