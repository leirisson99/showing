import Link from "next/link";
import { PainelHistoria } from "@/components/auth/PainelHistoria";
import { fonteDisplay, fonteTexto } from "@/components/landing/fontes";

// Layout dividido das telas de login: a história do produto de um lado, o formulário do outro.
// No celular a faixa visual (248 px) fica em cima. O painel fica montado ao trocar entre
// /login e /login/verificar, então os slides não reiniciam.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fonteDisplay.variable} ${fonteTexto.variable} auth-tema grid min-h-dvh flex-1 grid-rows-[248px_1fr] bg-(--auth-surface) font-[family-name:var(--font-inter)] text-(--auth-ink) md:grid-cols-[5fr_7fr] md:grid-rows-1 lg:grid-cols-2`}
    >
      <PainelHistoria />
      <div className="flex flex-col px-5 py-7 md:px-12 md:py-8">
        <div className="flex justify-end text-sm text-(--auth-ink-muted)">
          <span>
            Ainda não participa?{" "}
            <Link href="/" className="inline-flex min-h-11 items-center text-(--auth-primary) underline underline-offset-2">
              Conheça o piloto
            </Link>
          </span>
        </div>
        <div className="flex grow items-center py-6">{children}</div>
        <div className="flex flex-wrap justify-between gap-3 text-[13px] text-(--auth-ink-muted)">
          <span>Showing · piloto</span>
          <Link href="/#duvidas" className="inline-flex min-h-11 items-center text-(--auth-primary) underline underline-offset-2 md:min-h-0">
            Precisa de ajuda?
          </Link>
        </div>
      </div>
    </div>
  );
}
