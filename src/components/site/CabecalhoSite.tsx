import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

type Props = {
  links: { href: string; rotulo: string }[];
  /** Botão da direita (ex.: "Agendar visita"). */
  acao?: React.ReactNode;
  /** Mostra o link "Login" (corretor). */
  login?: boolean;
  /** "sobre-foto": absoluto, texto branco, por cima do hero. "claro": no fluxo, texto escuro. */
  tom?: "sobre-foto" | "claro";
};

// Cabeçalho sobre a foto do hero (modelo 2): marca à esquerda, links no centro, ações à direita.
export function CabecalhoSite({ links, acao, login = true, tom = "sobre-foto" }: Props) {
  const claro = tom === "claro";
  return (
    <header className={claro ? "relative z-20 text-foreground" : "absolute inset-x-0 top-0 z-20 text-white"}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" aria-label="Showing, página inicial" className={claro ? "rounded-md text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" : "rounded-md focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"}>
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={claro ? "transition-colors hover:text-foreground/70" : "transition-colors hover:text-white/70"}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          {login && (
            <Link href="/login" className={`hidden min-h-11 items-center transition-colors sm:inline-flex ${claro ? "hover:text-foreground/70" : "hover:text-white/70"}`}>
              Login
            </Link>
          )}
          {acao}
        </div>
      </div>
    </header>
  );
}
