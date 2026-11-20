import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { AtendenteIA } from "@/components/home/AtendenteIA";
import { Hero } from "@/components/home/Hero";
import { HistoriaScroll } from "@/components/home/HistoriaScroll";
import { MockChat, MockEmail, MockPagina } from "@/components/home/Mocks";
import { botaoCta } from "@/components/site/estilos";
import { CartoesSobrepostos } from "@/components/site/CartoesSobrepostos";
import { FaixaChamada } from "@/components/site/FaixaChamada";
import { Faq, type ItemFaq } from "@/components/site/Faq";
import { RodapeSite } from "@/components/site/RodapeSite";
import { UNSPLASH, urlUnsplash } from "@/mocks/unsplash";

export const metadata: Metadata = {
  title: "Showing — página do imóvel com atendente virtual",
  description:
    "Cadastre o imóvel e receba uma página exclusiva com um atendente virtual que conversa com o comprador e agenda a visita.",
  alternates: { canonical: "/" },
};

const PERGUNTAS: ItemFaq[] = [
  {
    pergunta: "O atendente inventa informações?",
    resposta:
      "Não. Ele responde só com os dados da ficha que você cadastrou e com as informações do bairro. O que não estiver lá, ele diz que vai confirmar com você.",
  },
  {
    pergunta: "Quem confirma a visita?",
    resposta: "Só você. O atendente registra o pedido de visita e envia o resumo; você confirma, realiza ou cancela pelo painel.",
  },
  {
    pergunta: "O comprador precisa criar conta?",
    resposta: "Não. Ele conversa direto na página do imóvel, sem login.",
  },
  {
    pergunta: "O que acontece com os dados do comprador?",
    resposta: "Nome e contato só são guardados depois que o comprador autoriza na conversa, e só você, dono do imóvel, os vê.",
  },
  {
    pergunta: "O atendente negocia preço?",
    resposta: "Não. Ele não negocia preço nem promete aprovação de financiamento. Esses assuntos passam para você.",
  },
];

function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-xs font-medium tracking-wide text-white/90 ring-1 ring-white/20">
      {children}
    </span>
  );
}

function Cena({ fase, selo, titulo, texto, children }: { fase: string; selo: string; titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <div data-beat={fase} className="beat">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start gap-4">
          <Selo>{selo}</Selo>
          <h2 className="text-[28px] leading-[1.05] font-medium text-balance sm:text-4xl lg:text-5xl">{titulo}</h2>
          <p className="max-w-md text-base text-white/75 lg:text-lg">{texto}</p>
        </div>
        <div className="flex justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}

const PONTOS = ["Responde só com a ficha do imóvel", "Passa para você o que não sabe", "Pede o aval do comprador antes de guardar dados"];

export default function Home() {
  return (
    <>
      <Hero />

      <CartoesSobrepostos
        itens={[
          { src: urlUnsplash(UNSPLASH.casaModerna.id, 700), alt: UNSPLASH.casaModerna.alt, numero: "01", titulo: "Página exclusiva", detalhe: "Fotos, ficha e mapa no seu link" },
          { src: urlUnsplash(UNSPLASH.casaVaranda.id, 700), alt: UNSPLASH.casaVaranda.alt, numero: "02", titulo: "Atendente virtual", detalhe: "Conversa e tira dúvidas do comprador" },
          { src: urlUnsplash(UNSPLASH.sala.id, 700), alt: UNSPLASH.sala.alt, numero: "03", titulo: "Visita agendada", detalhe: "Você confirma pelo painel" },
        ]}
      />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold tracking-wide text-cta uppercase">Para corretores</p>
          <h2 className="max-w-xl text-3xl leading-tight font-medium text-balance md:text-4xl">Cada imóvel apresentado do jeito certo, o tempo todo</h2>
          <p className="max-w-xl text-muted-foreground">
            O Showing junta a página do imóvel e um atendente virtual que responde ao comprador a qualquer hora, com os dados que você cadastrou, e
            leva a conversa até o pedido de visita. Você fica com o resumo e a decisão.
          </p>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/10">
          <p className="font-semibold">Como o atendente trabalha</p>
          <ul className="mt-4 flex flex-col gap-3">
            {PONTOS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px]">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                  <Check className="size-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HistoriaScroll>
        <div className="historia-palco">
          <div className="historia-fundo" aria-hidden />

          <Cena
            fase="pagina"
            selo="1 · A página"
            titulo="Cada imóvel ganha uma página exclusiva"
            texto="Fotos, ficha, descrição, mapa da região e dados do corretor, com um link próprio para divulgar."
          >
            <MockPagina />
          </Cena>

          <Cena
            fase="atendente"
            selo="2 · O atendente"
            titulo="Um atendente que conversa e qualifica"
            texto="Responde só com o que está na ficha. O que não sabe, passa para você."
          >
            <MockChat />
          </Cena>

          <Cena
            fase="visita"
            selo="3 · A visita"
            titulo="Você recebe o resumo e confirma"
            texto="O pedido de visita chega com contato, horário e dúvidas pendentes. Só você confirma a visita."
          >
            <div className="flex w-full flex-col items-center gap-5 lg:items-end">
              <MockEmail />
              <Link href="/login" className={botaoCta}>
                Entrar como corretor
              </Link>
            </div>
          </Cena>

          <div className="historia-progresso" aria-hidden />
        </div>
      </HistoriaScroll>

      <AtendenteIA />

      <section id="duvidas" className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold tracking-wide text-cta uppercase">Perguntas frequentes</p>
          <h2 className="text-3xl leading-tight font-medium md:text-4xl">O que os corretores perguntam</h2>
          <p className="text-muted-foreground">Respostas curtas sobre como o atendente trabalha e o que fica com você.</p>
        </div>
        <Faq itens={PERGUNTAS} />
      </section>

      <FaixaChamada
        titulo="Pronto para ter a página do seu imóvel e um atendente trabalhando por ela?"
        acao={
          <Link href="/login" className={botaoCta}>
            Entrar como corretor
          </Link>
        }
      />
      <RodapeSite />
    </>
  );
}
