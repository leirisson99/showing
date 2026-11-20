"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, MessageSquare, TriangleAlert } from "lucide-react";
import type { StatusVisita } from "@/lib/painel/atendimentos";
import { MarcarComoLida } from "./AcaoDeConversa";
import { BadgeVisita } from "./BadgeVisita";
import { FiltroAbas } from "./FiltroAbas";

export type ItemConversa = {
  id: string;
  quando: string;
  imovelTitulo: string;
  nome: string | null;
  contato: string | null;
  ultimaMensagem: string | null;
  totalMensagens: number;
  transferida: boolean;
  naoLida: boolean;
  motivo: string | null;
  visita: { status: StatusVisita; quando: string } | null;
};

const FILTROS = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "transferidas", rotulo: "Transferidas" },
  { valor: "contato", rotulo: "Com contato" },
  { valor: "visita", rotulo: "Com visita" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

const passa = (filtro: Filtro, i: ItemConversa) =>
  filtro === "todas" ||
  (filtro === "transferidas" && i.transferida) ||
  (filtro === "contato" && i.nome !== null) ||
  (filtro === "visita" && i.visita !== null);

export function ListaConversas({ itens }: { itens: ItemConversa[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const visiveis = itens.filter((i) => passa(filtro, i));

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-foreground/25 p-10 text-center">
        <MessageSquare className="size-8 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">
          Nenhuma conversa ainda. Quando um comprador falar com o atendente na página do imóvel, ela aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FiltroAbas filtros={FILTROS} valor={filtro} onChange={setFiltro} rotulo="Filtrar conversas" />

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhuma conversa neste filtro.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visiveis.map((i) => (
            <li key={i.id} className={`flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ${i.naoLida ? "ring-2 ring-cta" : "ring-foreground/10"}`}>
              <Link
                href={`/painel/conversas/${i.id}`}
                className="flex flex-col gap-2 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {i.nome ?? "Visitante sem contato"}
                      {i.naoLida && <span className="rounded-full bg-cta px-2 py-0.5 text-xs font-semibold text-cta-foreground">Nova</span>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{i.imovelTitulo}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{i.quando}</span>
                </div>
                {i.ultimaMensagem && <p className="line-clamp-2 text-[15px] text-foreground/80">“{i.ultimaMensagem}”</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {i.totalMensagens} {i.totalMensagens === 1 ? "mensagem do comprador" : "mensagens do comprador"}
                  </span>
                  {i.contato && <span>{i.contato}</span>}
                  {i.visita && (
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="size-4" aria-hidden />
                      {i.visita.quando}
                      <BadgeVisita status={i.visita.status} />
                    </span>
                  )}
                </div>
              </Link>
              {i.transferida && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFF4E0] px-4 py-3 text-sm text-[#7A4A00]">
                  <p className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <strong>Passou para você.</strong> {i.motivo}
                    </span>
                  </p>
                  {i.naoLida && <MarcarComoLida conversaId={i.id} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
