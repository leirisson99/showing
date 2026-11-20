"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff, MapPin, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FiltroAbas } from "./FiltroAbas";
import { formatarPreco } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatusImovel } from "@/lib/painel/tipos";
import { AcoesImovel } from "./AcoesImovel";
import { BadgeStatus } from "./BadgeStatus";

export type ItemLista = {
  id: string;
  slug: string;
  titulo: string;
  bairro: string;
  cidade: string;
  preco: number;
  status: StatusImovel;
  capaSrc: string | null;
  capaAlt: string;
  urlPublica: string;
};

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "publicado", rotulo: "Publicados" },
  { valor: "rascunho", rotulo: "Rascunhos" },
  { valor: "vendido", rotulo: "Vendidos" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

export function ListaImoveis({ itens }: { itens: ItemLista[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const visiveis = filtro === "todos" ? itens : itens.filter((i) => i.status === filtro);

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <p className="max-w-sm text-muted-foreground">
          Cadastre seu primeiro imóvel para ter sua página e seu atendente.
        </p>
        <Link href="/painel/imoveis/novo" className={cn(buttonVariants(), "h-11 px-4 text-base")}>
          <Plus data-icon="inline-start" /> Cadastrar primeiro imóvel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FiltroAbas filtros={FILTROS} valor={filtro} onChange={setFiltro} rotulo="Filtrar imóveis por situação" />

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum imóvel neste filtro.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visiveis.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <Link href={`/painel/imoveis/${i.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-20 sm:w-28">
                  {i.capaSrc ? (
                    <Image src={i.capaSrc} alt={i.capaAlt} fill sizes="112px" className="object-cover" />
                  ) : (
                    <ImageOff className="absolute inset-0 m-auto size-6 text-muted-foreground" aria-label="Sem fotos" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-semibold">{i.titulo}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{i.bairro}, {i.cidade}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{formatarPreco(i.preco)}</span>
                    <BadgeStatus status={i.status} />
                  </span>
                </div>
              </Link>
              <AcoesImovel id={i.id} titulo={i.titulo} slug={i.slug} status={i.status} urlPublica={i.urlPublica} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
