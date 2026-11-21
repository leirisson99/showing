import type { Metadata } from "next";
import Link from "next/link";
import { Beneficios } from "@/components/landing/Beneficios";
import { Cabecalho } from "@/components/landing/Cabecalho";
import { Comparacao } from "@/components/landing/Comparacao";
import { Demo } from "@/components/landing/Demo";
import { fonteDisplay, fonteTexto } from "@/components/landing/fontes";
import { Hero } from "@/components/landing/Hero";
import { Passos } from "@/components/landing/Passos";
import { Piloto } from "@/components/landing/Piloto";
import { Problema } from "@/components/landing/Problema";
import { Virada } from "@/components/landing/Virada";
import { Faq, type ItemFaq } from "@/components/site/Faq";
import { jsonLdSite, serializarJsonLd } from "@/lib/seo";

const TITULO = "Showing — assistente virtual para corretores de imóveis";
const DESCRICAO =
  "Para corretores de imóveis: cadastre o imóvel e receba uma página exclusiva com um atendente virtual que conversa com o comprador e agenda a visita.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/" },
  // A imagem vem de opengraph-image.tsx e twitter-image.tsx, ao lado deste arquivo.
  openGraph: { type: "website", locale: "pt_BR", siteName: "Showing", url: "/", title: TITULO, description: DESCRICAO },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO },
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

// Página de vendas para corretores (design "Página inicial para corretores"): rolagem contada em
// capítulos. O texto está todo no HTML; o movimento é só apresentação.
export default function Home() {
  return (
    <div className={`${fonteDisplay.variable} ${fonteTexto.variable} tema-marca scroll-suave font-[family-name:var(--font-inter)] text-(--auth-ink)`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLdSite(DESCRICAO)) }} />
      <Cabecalho />
      <main>
        <Hero />
        <Problema />
        <Virada />
        <Demo />
        <Beneficios />
        <Passos />
        <Comparacao />
        <section id="duvidas" data-tom="claro" className="bg-white py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
            <div className="flex flex-col gap-4">
              <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-ink-muted) uppercase">Perguntas frequentes</span>
              <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.08] font-bold tracking-[-0.02em] lg:text-[40px]">O que os corretores perguntam</h2>
              <p className="text-(--auth-ink-muted)">Respostas curtas sobre como o atendente trabalha e o que fica com você.</p>
            </div>
            <Faq itens={PERGUNTAS} />
          </div>
        </section>
        <Piloto />
      </main>
      <footer className="bg-(--auth-primary-deep) text-sm text-[#9fb3af]">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 py-7">
          <span>Showing</span>
          <Link href="/privacidade" className="inline-flex min-h-11 items-center text-(--auth-on-primary-muted) underline underline-offset-2">
            Política de privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
