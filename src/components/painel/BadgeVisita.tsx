import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusVisita } from "@/lib/painel/atendimentos";

// Cores da tabela de status do design system (pages.md, 2.2).
const ESTILO: Record<StatusVisita, { rotulo: string; classe: string }> = {
  pedida: { rotulo: "Pedida", classe: "bg-aviso-bg text-aviso" },
  confirmada: { rotulo: "Confirmada", classe: "bg-ok-bg text-ok" },
  realizada: { rotulo: "Realizada", classe: "bg-info-bg text-info" },
  cancelada: { rotulo: "Cancelada", classe: "bg-erro-bg text-erro" },
};

export function BadgeVisita({ status }: { status: StatusVisita }) {
  const { rotulo, classe } = ESTILO[status];
  return <Badge className={cn("border-transparent", classe)}>{rotulo}</Badge>;
}
