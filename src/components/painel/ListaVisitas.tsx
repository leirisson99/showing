"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Mail, MessageSquare, Phone } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { botaoContornoEscuro } from "@/components/site/estilos";
import { alterarStatusVisitaAction } from "@/app/(painel)/painel/visitas/actions";
import type { StatusVisita } from "@/lib/painel/atendimentos";
import { BadgeVisita } from "./BadgeVisita";
import { FiltroAbas } from "./FiltroAbas";
import { useAcao } from "./use-acao";

export type ItemVisita = {
  id: string;
  /** Chave do dia (AAAA-MM-DD, fuso de Brasília) para agrupar e ordenar. */
  dia: string;
  diaTexto: string;
  hora: string;
  status: StatusVisita;
  imovelId: string;
  imovelTitulo: string;
  conversaId: string;
  nome: string | null;
  telefone: string | null;
  telefoneTexto: string | null;
  email: string | null;
  pagamento: string | null;
  prazo: string | null;
};

const FILTROS = [
  { valor: "proximas", rotulo: "Próximas" },
  { valor: "passadas", rotulo: "Passadas" },
  { valor: "canceladas", rotulo: "Canceladas" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

const passa = (filtro: Filtro, status: StatusVisita) =>
  filtro === "proximas" ? status === "pedida" || status === "confirmada" : filtro === "passadas" ? status === "realizada" : status === "cancelada";

const contato =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/20 px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function ListaVisitas({ itens }: { itens: ItemVisita[] }) {
  const { rodar, pendente } = useAcao();
  const [filtro, setFiltro] = useState<Filtro>("proximas");
  const [cancelando, setCancelando] = useState<ItemVisita | null>(null);

  const visiveis = itens.filter((i) => passa(filtro, i.status));
  // Próximas: da mais perto para a mais longe. Passadas e canceladas: as mais recentes primeiro.
  const ordenadas = [...visiveis].sort((a, b) => {
    const ordem = `${a.dia} ${a.hora}`.localeCompare(`${b.dia} ${b.hora}`);
    return filtro === "proximas" ? ordem : -ordem;
  });
  const grupos = ordenadas.reduce<{ dia: string; texto: string; itens: ItemVisita[] }[]>((acc, i) => {
    const ultimo = acc[acc.length - 1];
    if (ultimo?.dia === i.dia) ultimo.itens.push(i);
    else acc.push({ dia: i.dia, texto: i.diaTexto, itens: [i] });
    return acc;
  }, []);

  const mudar = (i: ItemVisita, status: "confirmada" | "realizada" | "cancelada", sucesso: string) =>
    rodar(() => alterarStatusVisitaAction(i.id, status), sucesso);

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-foreground/25 p-10 text-center">
        <CalendarDays className="size-8 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">
          Nenhum pedido de visita ainda. Quando um comprador pedir pela conversa com o atendente, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FiltroAbas filtros={FILTROS} valor={filtro} onChange={setFiltro} rotulo="Filtrar visitas" />

      {grupos.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhuma visita neste filtro.</p>
      ) : (
        grupos.map((g) => (
          <section key={g.dia} aria-labelledby={`dia-${g.dia}`} className="flex flex-col gap-3">
            <h2 id={`dia-${g.dia}`} className="text-lg font-medium capitalize">
              {g.texto}
            </h2>
            <ul className="flex flex-col gap-3">
              {g.itens.map((i) => (
                <li key={i.id} className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-2xl leading-none font-medium tabular-nums">{i.hora}</p>
                      <Link href={`/painel/imoveis/${i.imovelId}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                        {i.imovelTitulo}
                      </Link>
                    </div>
                    <BadgeVisita status={i.status} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{i.nome ?? "Comprador"}</p>
                    {(i.pagamento || i.prazo) && (
                      <p className="text-sm text-muted-foreground">
                        {[i.pagamento && `Pagamento: ${i.pagamento}`, i.prazo && `Prazo: ${i.prazo}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {i.telefone && (
                      <>
                        <a href={`tel:+55${i.telefone}`} className={contato}>
                          <Phone className="size-4" aria-hidden /> Ligar {i.telefoneTexto}
                        </a>
                        <a href={`https://wa.me/55${i.telefone}`} target="_blank" rel="noopener noreferrer" className={contato}>
                          <MessageSquare className="size-4" aria-hidden /> WhatsApp
                        </a>
                      </>
                    )}
                    {i.email && (
                      <a href={`mailto:${i.email}`} className={contato}>
                        <Mail className="size-4" aria-hidden /> {i.email}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    {i.status === "pedida" && (
                      <Button type="button" className="h-11 rounded-full px-5" disabled={pendente} onClick={() => mudar(i, "confirmada", "Visita confirmada")}>
                        Confirmar visita
                      </Button>
                    )}
                    {i.status === "confirmada" && (
                      <Button type="button" className="h-11 rounded-full px-5" disabled={pendente} onClick={() => mudar(i, "realizada", "Visita marcada como realizada")}>
                        Marcar como realizada
                      </Button>
                    )}
                    {(i.status === "pedida" || i.status === "confirmada") && (
                      <button type="button" className={`${botaoContornoEscuro} disabled:opacity-50`} disabled={pendente} onClick={() => setCancelando(i)}>
                        Cancelar visita
                      </button>
                    )}
                    <Link href={`/painel/conversas/${i.conversaId}`} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium underline-offset-4 hover:underline">
                      <MessageSquare className="size-4" aria-hidden /> Ver conversa
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <AlertDialog open={cancelando !== null} onOpenChange={(aberto) => !aberto && setCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta visita?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelando?.diaTexto}, {cancelando?.hora} · {cancelando?.nome ?? "Comprador"}. O horário volta a ficar livre para o atendente. O
              comprador não é avisado automaticamente: fale com ele pelo contato informado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pendente} onClick={() => cancelando && mudar(cancelando, "cancelada", "Visita cancelada")}>
              Cancelar visita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
