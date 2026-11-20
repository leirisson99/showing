import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusImovel } from "@/lib/painel/tipos";

// Cores da tabela de status do design system (pages.md, 2.2).
const ESTILO: Record<StatusImovel, { rotulo: string; classe: string }> = {
  publicado: { rotulo: "Publicado", classe: "bg-[#E3F4EC] text-[#0B5A3B]" },
  rascunho: { rotulo: "Rascunho", classe: "bg-[#FFF4E0] text-[#7A4A00]" },
  vendido: { rotulo: "Vendido", classe: "bg-[#E8EEF6] text-[#1F3A5F]" },
};

export function BadgeStatus({ status }: { status: StatusImovel }) {
  const { rotulo, classe } = ESTILO[status];
  return <Badge className={cn("border-transparent", classe)}>{rotulo}</Badge>;
}
