"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marcarConversaLidaAction } from "@/app/(painel)/painel/conversas/actions";
import { useAcao } from "./use-acao";

export function MarcarComoLida({ conversaId, className }: { conversaId: string; className?: string }) {
  const { rodar, pendente } = useAcao();
  return (
    <Button
      type="button"
      variant="outline"
      className={`h-11 rounded-full ${className ?? ""}`}
      disabled={pendente}
      onClick={() => rodar(() => marcarConversaLidaAction(conversaId), "Marcada como lida")}
    >
      <Check data-icon="inline-start" /> Marcar como lida
    </Button>
  );
}
