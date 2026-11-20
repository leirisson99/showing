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
import { FiltroAbas } from "./FiltroAbas";
import { alterarStatusVisitaAction } from "@/app/(painel)/painel/visitas/actions";
import type { StatusVisita } from "@/lib/painel/atendimentos";
import { BadgeVisita } from "./BadgeVisita";
import { useAcao } from "./use-acao";

export type ItemVisita = {
  id: string;
  quando: string;
  status: StatusVisita;
  imovelId: string;
  imovelTitulo: string;
  conversaId: string;
  nome: string | null;
  telefone: string | null;
  telefoneTexto: string | null;
  email: string | null;
};

const FILTROS = [
  { valor: "proximas", rotulo: "Próximas" },
  { valor: "realizada", rotulo: "Realizadas" },
  { valor: "cancelada", rotulo: "Canceladas" },
  { valor: "todas", rotulo: "Todas" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

const passa = (filtro: Filtro, status: StatusVisita) =>
  filtro === "todas" || (filtro === "proximas" ? status === "pedida" || status === "confirmada" : status === filtro);

const link = "inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function ListaVisitas({ itens }: { itens: ItemVisita[] }) {
  const { rodar, pendente } = useAcao();
  const [filtro, setFiltro] = useState<Filtro>("proximas");
  const [cancelando, setCancelando] = useState<ItemVisita | null>(null);
  const visiveis = itens.filter((i) => passa(filtro, i.status));

  const mudar = (i: ItemVisita, status: "confirmada" | "realizada" | "cancelada", sucesso: string) =>
    rodar(() => alterarStatusVisitaAction(i.id, status), sucesso);

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <CalendarDays className="size-8 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">
          Nenhum pedido de visita ainda. Quando um comprador pedir pela conversa com o atendente, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FiltroAbas filtros={FILTROS} valor={filtro} onChange={setFiltro} rotulo="Filtrar visitas" />

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhuma visita neste filtro.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visiveis.map((i) => (
            <li key={i.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-lg font-semibold">{i.quando}</p>
                  <Link href={`/painel/imoveis/${i.imovelId}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                    {i.imovelTitulo}
                  </Link>
                </div>
                <BadgeVisita status={i.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-5">
                <span className="font-medium">{i.nome ?? "Comprador"}</span>
                {i.telefone && (
                  <a href={`tel:+55${i.telefone}`} className={link}>
                    <Phone className="size-4" aria-hidden /> {i.telefoneTexto}
                  </a>
                )}
                {i.email && (
                  <a href={`mailto:${i.email}`} className={link}>
                    <Mail className="size-4" aria-hidden /> {i.email}
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {i.status === "pedida" && (
                  <Button type="button" className="h-11" disabled={pendente} onClick={() => mudar(i, "confirmada", "Visita confirmada")}>
                    Confirmar visita
                  </Button>
                )}
                {i.status === "confirmada" && (
                  <Button type="button" className="h-11" disabled={pendente} onClick={() => mudar(i, "realizada", "Visita marcada como realizada")}>
                    Marcar como realizada
                  </Button>
                )}
                {(i.status === "pedida" || i.status === "confirmada") && (
                  <Button type="button" variant="outline" className="h-11" disabled={pendente} onClick={() => setCancelando(i)}>
                    Cancelar visita
                  </Button>
                )}
                <Link href={`/painel/conversas/${i.conversaId}`} className={link}>
                  <MessageSquare className="size-4" aria-hidden /> Ver conversa
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={cancelando !== null} onOpenChange={(aberto) => !aberto && setCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta visita?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelando?.quando} · {cancelando?.nome ?? "Comprador"}. O horário volta a ficar livre para o atendente. O comprador não é
              avisado automaticamente: fale com ele pelo contato informado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendente}
              onClick={() => cancelando && mudar(cancelando, "cancelada", "Visita cancelada")}
            >
              Cancelar visita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
