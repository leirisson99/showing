import Image from "next/image";
import Link from "next/link";
import { LogoMarca } from "@/components/brand/Logo";
import { botaoContorno, botaoCta } from "@/components/site/estilos";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { AnimatedHeading } from "./AnimatedHeading";
import { FadeIn } from "./FadeIn";
import { UNSPLASH, urlUnsplash } from "@/mocks/unsplash";

// Hero no formato do modelo 2: foto escurecida à esquerda, texto alinhado à esquerda, dois
// botões e um selo. A foto é de exemplo (Unsplash); trocar por uma do produto quando houver.
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[680px] flex-col overflow-hidden bg-deep font-sans text-white md:min-h-[760px]">
      <Image
        src={urlUnsplash(UNSPLASH.casaModerna.id, 2000)}
        alt={UNSPLASH.casaModerna.alt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep/90 via-deep/60 to-deep/15" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep/70 via-transparent to-deep/40" aria-hidden />

      {/* Sem JavaScript as animações de entrada não rodam: mostra tudo já visível. */}
      <noscript>
        <style>{".hero-anim{opacity:1!important;transform:none!important}"}</style>
      </noscript>

      <CabecalhoSite
        links={[
          { href: "#como-funciona", rotulo: "Como funciona" },
          { href: "#atendente-ia", rotulo: "O atendente" },
          { href: "#duvidas", rotulo: "Dúvidas" },
        ]}
        login={false}
        acao={
          <Link href="/login" className={botaoCta}>
            Entrar<span className="hidden sm:inline"> como corretor</span>
          </Link>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5 px-5 pt-32 pb-40">
        <p className="text-sm font-semibold tracking-wide text-ouro uppercase">Página exclusiva + atendente virtual</p>
        <AnimatedHeading
          text="Seu imóvel ganha página própria e um atendente que marca a visita."
          className="max-w-3xl text-4xl leading-[1.05] font-medium text-balance md:text-5xl lg:text-6xl"
          style={{ letterSpacing: "-0.03em" }}
        />
        <FadeIn delay={800} duration={1000}>
          <p className="max-w-xl text-base text-white/85 md:text-lg">
            Cadastre o imóvel e o atendente virtual conversa com o comprador, tira dúvidas com os dados da ficha e agenda a visita.
          </p>
        </FadeIn>
        <FadeIn delay={1200} duration={1000}>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={botaoCta}>
              Entrar como corretor
            </Link>
            <a href="#como-funciona" className={botaoContorno}>
              Ver como funciona
            </a>
          </div>
        </FadeIn>
        <FadeIn delay={1400} duration={1000}>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-ouro text-deep">
              <LogoMarca className="size-7" />
            </span>
            <p className="text-sm leading-snug text-white/85">
              Em teste com
              <br />
              <strong className="font-semibold text-white">corretores de Blumenau</strong>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
