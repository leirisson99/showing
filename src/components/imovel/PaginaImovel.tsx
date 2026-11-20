import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { LogoMarca } from "@/components/brand/Logo";
import { ChatBubbleLazy } from "@/components/chat-bubble/ChatBubbleLazy";
import { botaoCta } from "@/components/site/estilos";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { CartoesSobrepostos } from "@/components/site/CartoesSobrepostos";
import { FaixaChamada } from "@/components/site/FaixaChamada";
import { Faq, type ItemFaq } from "@/components/site/Faq";
import { RodapeSite } from "@/components/site/RodapeSite";
import { formatarPreco } from "@/lib/format";
import { TIPOS } from "@/lib/painel/schema";
import type { ImovelPublico } from "@/lib/imoveis";
import { cn } from "@/lib/utils";
import { BarraAcaoMobile } from "./BarraAcaoMobile";
import { BotaoChat } from "./BotaoChat";
import { CartaoCorretor } from "./CartaoCorretor";
import { DescricaoImovel } from "./DescricaoImovel";
import { MedidasDoImovel, PrecoImovel, SelosDoImovel } from "./FichaImovel";
import { GaleriaGrade } from "./GaleriaGrade";
import { InfoBairro } from "./InfoBairro";
import { MapaRegiao } from "./MapaRegiao";

type Props = {
  imovel: ImovelPublico;
  /** Texto do aviso quando é a pré-visualização do corretor (sem eventos nem indexação). */
  aviso?: string;
};

const secao = "mx-auto w-full max-w-6xl px-5 py-16";
const rotuloSecao = "text-sm font-semibold tracking-wide text-cta uppercase";
const titulo2 = "text-3xl leading-tight font-medium md:text-4xl";

// Perguntas frequentes montadas só com dados do anúncio (nada inventado).
function perguntas(i: ImovelPublico, vendido: boolean): ItemFaq[] {
  const itens: ItemFaq[] = [
    {
      pergunta: "Aceita financiamento?",
      resposta: i.aceitaFinanciamento
        ? "Sim, o anúncio informa que aceita financiamento. A aprovação e as condições dependem do banco."
        : "O anúncio não indica que aceita financiamento. Pergunte ao atendente: ele confirma com o corretor.",
    },
  ];
  if (i.aceitaFgts !== null) {
    itens.push({
      pergunta: "Aceita FGTS?",
      resposta: i.aceitaFgts ? "Sim, o anúncio informa que aceita FGTS." : "O anúncio informa que não aceita FGTS.",
    });
  }
  const custos = [i.condominio !== null && `condomínio de ${formatarPreco(i.condominio)}`, i.iptu !== null && `IPTU de ${formatarPreco(i.iptu)}`].filter(Boolean);
  itens.push({
    pergunta: "Qual o valor do condomínio e do IPTU?",
    resposta: custos.length > 0 ? `O anúncio informa ${custos.join(" e ")}.` : "Esses valores não constam no anúncio. O atendente confirma com o corretor.",
  });
  itens.push({
    pergunta: "Onde fica o imóvel?",
    resposta: `No bairro ${i.bairro}, em ${i.cidade}. ${i.mostrarEndereco && i.endereco ? `Endereço: ${i.endereco}.` : "O endereço completo é combinado com o corretor."}`,
  });
  if (!vendido) {
    itens.push({
      pergunta: "Como agendo uma visita?",
      resposta: "Use o botão Agendar visita ou converse com o atendente virtual: ele mostra os horários livres do corretor e envia o pedido. O corretor confirma o horário.",
    });
  }
  itens.push({
    pergunta: "Com quem estou falando no chat?",
    resposta: "Com um assistente virtual do corretor. Ele responde só com os dados do anúncio e passa para o corretor o que não souber.",
  });
  return itens;
}

export function PaginaImovel({ imovel, aviso }: Props) {
  const vendido = imovel.status === "vendido";
  const capa = imovel.fotos[0];
  const demais = imovel.fotos.slice(1);
  const destaques = demais.slice(0, 3);
  const fotoFicha = demais[3] ?? demais[0] ?? capa;
  const fotoDetalhes = demais[1] ?? capa;
  const fotoDuvidas = demais[2] ?? capa;
  const tipo = TIPOS[imovel.tipo];

  return (
    <>
      {aviso && (
        <div role="status" className="bg-cta px-4 py-3 text-center font-medium text-cta-foreground">
          {aviso}
        </div>
      )}
      {vendido && (
        <div role="status" className="bg-sand px-4 py-3 text-center font-medium text-foreground">
          Este imóvel foi vendido
        </div>
      )}

      <section className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-deep text-white md:min-h-[720px]">
        {capa && <Image src={capa.src} alt={capa.alt} fill priority sizes="100vw" className="-z-20 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep/90 via-deep/55 to-deep/10" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep/70 via-transparent to-deep/40" aria-hidden />

        <CabecalhoSite
          links={[
            { href: "#sobre", rotulo: "Sobre" },
            { href: "#ficha", rotulo: "Ficha técnica" },
            { href: "#duvidas", rotulo: "Dúvidas" },
            { href: "#galeria", rotulo: "Galeria" },
          ]}
          acao={
            vendido ? undefined : (
              <BotaoChat modo="agendamento" variante="accent">
                Agendar visita
              </BotaoChat>
            )
          }
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5 px-5 pt-32 pb-36">
          <p className="text-sm font-semibold tracking-wide text-[#C9A66B] uppercase">
            {tipo} · {imovel.bairro}
          </p>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-medium text-balance md:text-6xl">{imovel.titulo}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-5" aria-hidden /> {imovel.bairro}, {imovel.cidade}
            </span>
            <span aria-hidden>·</span>
            <strong className="font-semibold text-white">{formatarPreco(imovel.preco)}</strong>
          </p>
          {!vendido && (
            <div className="flex flex-wrap gap-3">
              <BotaoChat modo="agendamento" variante="accent">
                Agendar visita
              </BotaoChat>
              <BotaoChat modo="conversa" variante="contorno">
                Falar com o corretor
              </BotaoChat>
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#C9A66B] text-deep">
              <LogoMarca className="size-7" />
            </span>
            <p className="text-sm leading-snug text-white/85">
              Anunciado por
              <br />
              <strong className="font-semibold text-white">
                {imovel.corretor.nome} · {imovel.corretor.creci}
              </strong>
            </p>
          </div>
        </div>
      </section>

      <CartoesSobrepostos
        itens={destaques.map((f, n) => ({
          src: f.src,
          alt: f.alt,
          numero: String(n + 1).padStart(2, "0"),
          titulo: f.legenda ?? `Foto ${n + 2}`,
        }))}
      />

      <main>
        <section id="sobre" className={cn(secao, "grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14")}>
          <div className="flex flex-col gap-5">
            <p className={rotuloSecao}>Sobre o imóvel</p>
            <h2 className={titulo2}>
              {tipo} em {imovel.bairro}, {imovel.cidade}
            </h2>
            <DescricaoImovel texto={imovel.descricao} />
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/10">
              <PrecoImovel imovel={imovel} />
              <SelosDoImovel imovel={imovel} />
              {!vendido && (
                <div className="flex flex-col gap-3">
                  <BotaoChat modo="agendamento" variante="accent" className="w-full">
                    Agendar visita
                  </BotaoChat>
                  <BotaoChat modo="conversa" variante="outline" className="w-full">
                    Tirar dúvidas
                  </BotaoChat>
                </div>
              )}
            </div>
            <CartaoCorretor imovel={imovel} />
          </aside>
        </section>

        <section id="ficha" className={cn(secao, "pt-0")}>
          <div className="grid overflow-hidden rounded-3xl bg-muted md:grid-cols-2">
            <div className="flex flex-col gap-5 p-8 md:p-12">
              <p className={rotuloSecao}>Ficha técnica</p>
              <h2 className="text-3xl leading-tight font-medium">{imovel.titulo}</h2>
              <MedidasDoImovel imovel={imovel} />
              <PrecoImovel imovel={imovel} />
              {!vendido && (
                <BotaoChat modo="agendamento" className="w-fit">
                  Agendar visita
                </BotaoChat>
              )}
            </div>
            {fotoFicha && (
              <div className="relative min-h-72 md:min-h-full">
                <Image src={fotoFicha.src} alt={fotoFicha.alt} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        </section>

        {imovel.caracteristicas.length > 0 && (
          <section id="detalhes" className={cn(secao, "grid items-center gap-10 pt-0 lg:grid-cols-2 lg:gap-16")}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <p className={rotuloSecao}>Destaques</p>
                <h2 className={titulo2}>Detalhes importantes</h2>
              </div>
              <ol className="flex flex-col">
                {imovel.caracteristicas.map((c, n) => (
                  <li key={c} className="flex items-center gap-4 border-b border-foreground/15 py-4">
                    <span className="w-8 text-sm text-muted-foreground">{String(n + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-base font-medium">{c}</span>
                    <span className="flex size-8 items-center justify-center rounded-full border border-foreground/30" aria-hidden>
                      <ArrowRight className="size-4" />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {fotoDetalhes && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                <Image src={fotoDetalhes.src} alt={fotoDetalhes.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
            )}
          </section>
        )}

        <section id="duvidas" className={cn(secao, "grid gap-10 pt-0 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16")}>
          <div className="flex flex-col gap-5">
            <p className={rotuloSecao}>Dúvidas frequentes</p>
            <h2 className={titulo2}>Tudo o que o anúncio informa</h2>
            <p className="text-muted-foreground">As respostas vêm dos dados do anúncio. O que não está nele, o atendente confirma com o corretor.</p>
            {fotoDuvidas && (
              <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl bg-muted lg:block">
                <Image src={fotoDuvidas.src} alt={fotoDuvidas.alt} fill sizes="360px" className="object-cover" />
              </div>
            )}
          </div>
          <Faq itens={perguntas(imovel, vendido)} />
        </section>

        <section id="local" className={cn(secao, "flex flex-col gap-6 pt-0")}>
          <div className="flex flex-col gap-3">
            <p className={rotuloSecao}>Localização</p>
            <h2 className={titulo2}>Onde fica</h2>
          </div>
          <MapaRegiao imovel={imovel} />
          {imovel.infoBairro && <InfoBairro info={imovel.infoBairro} bairro={imovel.bairro} />}
        </section>

        <section id="galeria" className={cn(secao, "flex flex-col gap-6 pt-0")}>
          <h2 className={titulo2}>Galeria do imóvel</h2>
          <GaleriaGrade fotos={imovel.fotos} />
        </section>
      </main>

      <FaixaChamada
        titulo={vendido ? `Fale com ${imovel.corretor.nome} sobre outros imóveis.` : `Quer conhecer este imóvel? Fale com ${imovel.corretor.nome}.`}
        acao={
          vendido ? (
            imovel.corretor.whatsapp ? (
              <a href={`https://wa.me/${imovel.corretor.whatsapp}`} target="_blank" rel="noopener noreferrer" className={botaoCta}>
                Chamar no WhatsApp
              </a>
            ) : undefined
          ) : (
            <BotaoChat modo="conversa" variante="accent">
              Falar com o corretor
            </BotaoChat>
          )
        }
      />
      <RodapeSite />

      {!vendido && <BarraAcaoMobile preco={imovel.preco} />}
      {!vendido && (
        <ChatBubbleLazy
          imovelId={imovel.id}
          corretor={imovel.corretor.nome}
          whatsapp={imovel.corretor.whatsapp}
          imovel={{
            preco: imovel.preco,
            condominio: imovel.condominio,
            iptu: imovel.iptu,
            aceitaFinanciamento: imovel.aceitaFinanciamento,
            aceitaFgts: imovel.aceitaFgts,
            quartos: imovel.quartos,
            areaM2: imovel.areaM2,
            bairro: imovel.bairro,
          }}
        />
      )}
    </>
  );
}
