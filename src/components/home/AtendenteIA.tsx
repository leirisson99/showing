import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { botaoCta } from "@/components/site/estilos";
import { UNSPLASH, urlUnsplash, type FotoUnsplash } from "@/mocks/unsplash";

// Faixa escura sobre o atendente virtual (modelo 1, "Espaços que inspiram harmonia").
// Cada cartão é uma regra que o atendente segue (CLAUDE.md, "Atendente IA"). As fotos são
// ilustrativas (Unsplash). Sem número, preço ou promessa de resultado.

type Regra = { foto: FotoUnsplash; titulo: string; etiqueta: string; texto: string };

const REGRAS: Regra[] = [
  {
    foto: UNSPLASH.casaModerna,
    titulo: "Responde só com a ficha",
    etiqueta: "Confiança",
    texto: "Usa os dados que você cadastrou e o bairro. O que não está lá, ele não inventa.",
  },
  {
    foto: UNSPLASH.casaCampo,
    titulo: "Passa para você o que não sabe",
    etiqueta: "Transferência",
    texto: "Diz que vai confirmar com você e envia a dúvida no resumo.",
  },
  {
    foto: UNSPLASH.casaVaranda,
    titulo: "Agenda só horários livres",
    etiqueta: "Agenda",
    texto: "Não negocia preço, pede o aval do comprador e você confirma a visita.",
  },
];

function CartaoRegra({ r }: { r: Regra }) {
  return (
    <li className="group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl bg-moss p-5 text-white">
      <Image
        src={urlUnsplash(r.foto.id, 900)}
        alt={r.foto.alt}
        fill
        sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 100vw"
        className="-z-20 object-cover transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.06] motion-reduce:transition-none"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep/95 via-deep/40 to-transparent" aria-hidden />
      <p className="text-xs font-semibold tracking-wide text-[#C9A66B] uppercase">{r.etiqueta}</p>
      <h3 className="mt-1 text-lg leading-tight font-semibold">{r.titulo}</h3>
      <p className="mt-2 text-sm text-white/80">{r.texto}</p>
      <span className="mt-3 flex size-8 items-center justify-center rounded-full border border-white/40" aria-hidden>
        <ArrowRight className="size-4" />
      </span>
    </li>
  );
}

export function AtendenteIA() {
  return (
    <section id="atendente-ia" aria-labelledby="titulo-atendente" className="px-4 py-16 md:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-8 rounded-3xl bg-deep p-6 text-white md:p-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col items-start gap-5">
          <p className="text-sm font-semibold tracking-wide text-[#C9A66B] uppercase">Atendente virtual</p>
          <h2 id="titulo-atendente" className="text-3xl leading-tight font-medium text-balance">
            Um atendente que fala só o que o seu imóvel diz
          </h2>
          <p className="text-white/75">
            Ele conversa com o comprador na página do imóvel, qualifica o interesse e pede a visita, sempre dentro destas regras. Você recebe o
            resumo e confirma.
          </p>
          <Link href="/login" className={botaoCta}>
            Cadastrar meu imóvel
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {REGRAS.map((r) => (
            <CartaoRegra key={r.titulo} r={r} />
          ))}
        </ul>
      </div>
      <p className="mx-auto mt-4 w-full max-w-6xl text-sm text-muted-foreground">Fotos ilustrativas do Unsplash.</p>
    </section>
  );
}
