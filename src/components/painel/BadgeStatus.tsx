import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusImovel } from "@/lib/painel/tipos";

// Cores da tabela de status do design system (pages.md, 2.2).
const ESTILO: Record<StatusImovel, { rotulo: string; classe: string }> = {
  publicado: { rotulo: "Publicado", classe: "bg-ok-bg text-ok" },
  rascunho: { rotulo: "Rascunho", classe: "bg-aviso-bg text-aviso" },
  vendido: { rotulo: "Vendido", classe: "bg-info-bg text-info" },
};

export function BadgeStatus({ status }: { status: StatusImovel }) {
  const { rotulo, classe } = ESTILO[status];
  return <Badge className={cn("border-transparent", classe)}>{rotulo}</Badge>;
}
