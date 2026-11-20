import Link from "next/link";
import { CalendarCheck, Eye, MessageSquare, UserRound } from "lucide-react";
import { BadgeVisita } from "../BadgeVisita";
import { CartaoMetrica } from "../CartaoMetrica";
import type { Metricas } from "@/lib/painel/metricas";
import type { StatusVisita } from "@/lib/painel/atendimentos";

export type ConversaResumida = { id: string; quando: string; resumo: string; naoLida: boolean };
export type VisitaResumida = { id: string; quando: string; status: StatusVisita; nome: string };

type Props = { metricas: Metricas; conversas: ConversaResumida[]; visitas: VisitaResumida[] };

// Aba "Desempenho" (pages.md §3.9): números dos últimos 30 dias e as conversas e visitas do imóvel.
export function DesempenhoImovel({ metricas, conversas, visitas }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoMetrica rotulo="Visualizações" valor={metricas.visualizacoes} Icone={Eye} detalhe="últimos 30 dias" />
        <CartaoMetrica rotulo="Conversas" valor={metricas.conversas} Icone={MessageSquare} detalhe="últimos 30 dias" />
        <CartaoMetrica rotulo="Contatos" valor={metricas.contatos} Icone={UserRound} detalhe="últimos 30 dias" />
        <CartaoMetrica rotulo="Visitas pedidas" valor={metricas.visitas} Icone={CalendarCheck} detalhe="últimos 30 dias" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="conv" className="flex flex-col gap-3">
          <h3 id="conv" className="text-lg font-medium">Conversas</h3>
          {conversas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversa neste imóvel ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {conversas.map((c) => (
                <li key={c.id}>
                  <Link href={`/painel/conversas/${c.id}`} className="flex flex-col gap-0.5 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted">
                    <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      {c.quando}
                      {c.naoLida && <span className="rounded-full bg-cta px-2 py-0.5 text-xs font-semibold text-cta-foreground">Nova</span>}
                    </span>
                    <span className="line-clamp-2 text-[15px]">{c.resumo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="vis" className="flex flex-col gap-3">
          <h3 id="vis" className="text-lg font-medium">Visitas</h3>
          {visitas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido de visita neste imóvel ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visitas.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                  <span className="text-[15px]"><strong>{v.quando}</strong> · {v.nome}</span>
                  <BadgeVisita status={v.status} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/painel/visitas" className="inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-4">Gerenciar visitas</Link>
        </section>
      </div>
    </div>
  );
}
