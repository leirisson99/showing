import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusVisita } from "@/lib/painel/atendimentos";

// Cores da tabela de status do design system (pages.md, 2.2).
const ESTILO: Record<StatusVisita, { rotulo: string; classe: string }> = {
  pedida: { rotulo: "Pedida", classe: "bg-[#FFF4E0] text-[#7A4A00]" },
  confirmada: { rotulo: "Confirmada", classe: "bg-[#E3F4EC] text-[#0B5A3B]" },
  realizada: { rotulo: "Realizada", classe: "bg-[#E8EEF6] text-[#1F3A5F]" },
  cancelada: { rotulo: "Cancelada", classe: "bg-[#FDECEA] text-[#8A1C12]" },
};

export function BadgeVisita({ status }: { status: StatusVisita }) {
  const { rotulo, classe } = ESTILO[status];
  return <Badge className={cn("border-transparent", classe)}>{rotulo}</Badge>;
}
