"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff, MapPin, Plus } from "lucide-react";
import { botaoEscuro } from "@/components/site/estilos";
import { formatarPreco } from "@/lib/format";
import type { StatusImovel } from "@/lib/painel/tipos";
import { AcoesImovel } from "./AcoesImovel";
import { BadgeStatus } from "./BadgeStatus";
import { FiltroAbas } from "./FiltroAbas";

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
  /** Últimos 30 dias. */
  visualizacoes: number;
  conversas: number;
  visitas: number;
};

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "publicado", rotulo: "Publicados" },
  { valor: "rascunho", rotulo: "Rascunhos" },
  { valor: "vendido", rotulo: "Vendidos" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

const numero = new Intl.NumberFormat("pt-BR");

function Capa({ i, tamanho }: { i: ItemLista; tamanho: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl bg-muted ${tamanho}`}>
      {i.capaSrc ? (
        <Image src={i.capaSrc} alt={i.capaAlt} fill sizes="112px" className="object-cover" />
      ) : (
        <ImageOff className="absolute inset-0 m-auto size-6 text-muted-foreground" aria-label="Sem fotos" />
      )}
    </div>
  );
}

const focoLink = "rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function ListaImoveis({ itens }: { itens: ItemLista[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const visiveis = filtro === "todos" ? itens : itens.filter((i) => i.status === filtro);

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-foreground/25 p-10 text-center">
        <p className="max-w-sm text-muted-foreground">Cadastre seu primeiro imóvel para ter sua página e seu atendente.</p>
        <Link href="/painel/imoveis/novo" className={botaoEscuro}>
          <Plus className="size-4" aria-hidden /> Cadastrar primeiro imóvel
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
        <>
          {/* Desktop: tabela, com as métricas dos últimos 30 dias. */}
          <div className="hidden overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Seus imóveis, com visualizações, conversas e visitas dos últimos 30 dias</caption>
              <thead className="border-b bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Imóvel</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Situação</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Preço</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Visualizações</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Conversas</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Visitas</th>
                  <th scope="col" className="w-14 px-2 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visiveis.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/painel/imoveis/${i.id}`} className={`flex items-center gap-3 ${focoLink}`}>
                        <Capa i={i} tamanho="h-16 w-24" />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-semibold">{i.titulo}</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{i.bairro}, {i.cidade}</span>
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><BadgeStatus status={i.status} /></td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatarPreco(i.preco)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{numero.format(i.visualizacoes)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{numero.format(i.conversas)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{numero.format(i.visitas)}</td>
                    <td className="px-2 py-3">
                      <AcoesImovel id={i.id} titulo={i.titulo} slug={i.slug} status={i.status} urlPublica={i.urlPublica} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: cartões. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {visiveis.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 rounded-3xl bg-card p-3 ring-1 ring-foreground/10">
                <div className="flex items-center gap-3">
                  <Link href={`/painel/imoveis/${i.id}`} className={`flex min-w-0 flex-1 items-center gap-3 ${focoLink}`}>
                    <Capa i={i} tamanho="size-20" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-semibold">{i.titulo}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{i.bairro}, {i.cidade}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{formatarPreco(i.preco)}</span>
                        <BadgeStatus status={i.status} />
                      </span>
                    </span>
                  </Link>
                  <AcoesImovel id={i.id} titulo={i.titulo} slug={i.slug} status={i.status} urlPublica={i.urlPublica} />
                </div>
                <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs text-muted-foreground">
                  <div><dd className="text-base font-medium text-foreground tabular-nums">{numero.format(i.visualizacoes)}</dd><dt>Visualizações</dt></div>
                  <div><dd className="text-base font-medium text-foreground tabular-nums">{numero.format(i.conversas)}</dd><dt>Conversas</dt></div>
                  <div><dd className="text-base font-medium text-foreground tabular-nums">{numero.format(i.visitas)}</dd><dt>Visitas</dt></div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
