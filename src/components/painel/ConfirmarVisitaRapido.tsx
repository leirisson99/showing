"use client";

import { Button } from "@/components/ui/button";
import { alterarStatusVisitaAction } from "@/app/(painel)/painel/visitas/actions";
import { useAcao } from "./use-acao";

// Ação rápida da visão geral (pages.md §3.6): confirma o pedido sem sair da tela.
export function ConfirmarVisitaRapido({ visitaId }: { visitaId: string }) {
  const { rodar, pendente } = useAcao();
  return (
    <Button
      type="button"
      className="h-11 rounded-full px-5"
      disabled={pendente}
      onClick={() => rodar(() => alterarStatusVisitaAction(visitaId, "confirmada"), "Visita confirmada")}
    >
      Confirmar
    </Button>
  );
}
