import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNSPLASH, urlUnsplash } from "@/mocks/unsplash";

// Maquetes ilustrativas da página inicial. Os dados são de exemplo e estão marcados como tal.

const quadro = "rounded-2xl bg-white text-foreground shadow-2xl ring-1 ring-black/5";
const exemplo = "text-[11px] font-medium tracking-wide text-muted-foreground uppercase";

export function MockPagina() {
  return (
    <figure className={cn(quadro, "w-full max-w-md overflow-hidden")} aria-label="Exemplo ilustrativo de página de imóvel">
      <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#DDE3E1]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#DDE3E1]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#DDE3E1]" aria-hidden />
        <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 text-[11px] text-muted-foreground">
          /imovel/apartamento-2-quartos-victor-konder-blumenau
        </span>
      </div>
      <div className="relative h-32 bg-muted sm:h-40">
        <Image src={urlUnsplash(UNSPLASH.sala.id, 900)} alt={`${UNSPLASH.sala.alt} (foto de exemplo)`} fill sizes="448px" className="object-cover" />
        <span className="absolute right-3 bottom-2 rounded-full bg-foreground/80 px-2.5 py-0.5 text-xs text-background">1/12</span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <p className="font-heading text-lg leading-tight font-bold">Apartamento de 2 quartos no Victor Konder</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden /> Victor Konder, Blumenau
        </p>
        <p className="font-heading text-2xl font-bold text-primary">R$ 480.000</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1">2 quartos</span>
          <span className="rounded-full bg-muted px-2.5 py-1">68 m²</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Aceita financiamento</span>
        </div>
        <p className={exemplo}>Exemplo ilustrativo</p>
      </div>
    </figure>
  );
}

type Fala = { de: "assistente" | "comprador"; texto: string; opcoes?: string[] };

const FALAS: Fala[] = [
  { de: "assistente", texto: "Oi! Sou o assistente virtual do corretor. Como posso ajudar?" },
  { de: "comprador", texto: "Aceita financiamento?" },
  { de: "assistente", texto: "A ficha informa que aceita. A aprovação depende do banco." },
  { de: "comprador", texto: "Quero agendar uma visita" },
  { de: "assistente", texto: "Tenho estes horários. Qual prefere?", opcoes: ["Sáb, 10:00", "Sáb, 11:00"] },
];

export function MockChat() {
  return (
    <figure className={cn(quadro, "flex w-full max-w-sm flex-col overflow-hidden")} aria-label="Exemplo ilustrativo de conversa com o atendente">
      <figcaption className="bg-primary px-4 py-3 font-heading text-sm font-semibold text-primary-foreground">
        Assistente virtual do corretor
      </figcaption>
      <ol className="flex flex-col gap-2 p-4">
        {FALAS.map((f, i) => (
          <li
            key={f.texto}
            style={{ "--i": i } as React.CSSProperties}
            className={cn("msg flex max-w-[88%] flex-col gap-2", f.de === "comprador" ? "self-end" : "self-start")}
          >
            <p
              className={cn(
                "rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                f.de === "comprador" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {f.texto}
            </p>
            {f.opcoes && (
              <span className="flex flex-wrap gap-2">
                {f.opcoes.map((o) => (
                  <span key={o} className="rounded-full border border-primary px-3 py-1 text-sm text-primary">
                    {o}
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className={cn(exemplo, "px-4 pb-3")}>Exemplo ilustrativo</p>
    </figure>
  );
}

export function MockEmail() {
  const linhas = [
    ["Comprador", "Maria (exemplo)"],
    ["Contato", "Telefone informado"],
    ["Horário pedido", "Sábado, 10:00"],
    ["Dúvida pendente", "Condomínio"],
  ];
  return (
    <figure className={cn(quadro, "w-full max-w-sm overflow-hidden")} aria-label="Exemplo ilustrativo do resumo enviado ao corretor">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
        <p className="font-heading text-sm font-semibold">Nova visita pedida</p>
        <span className="rounded-full bg-[#FFF4E0] px-2.5 py-0.5 text-xs font-medium text-[#7A4A00]">Pedida</span>
      </div>
      <dl className="flex flex-col p-4 text-[15px]">
        {linhas.map(([rotulo, valor], i) => (
          <div key={rotulo} style={{ "--i": i } as React.CSSProperties} className="msg flex justify-between gap-4 border-b py-2 last:border-b-0">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="font-medium">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className={cn(exemplo, "px-4 pb-3")}>Exemplo ilustrativo</p>
    </figure>
  );
}
