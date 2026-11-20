import { CalendarCheck } from "lucide-react";

// Confirmação do pedido de visita dentro da conversa (pages.md §4.1). A visita só fica
// confirmada depois que o corretor confirmar.
export function CartaoVisita({ horario, imovel }: { horario: string; imovel: string }) {
  return (
    <div role="status" className="flex max-w-[85%] items-start gap-3 self-start rounded-2xl border border-primary/30 bg-card p-4 text-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
        <CalendarCheck className="size-5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">Visita pedida</p>
        <p>{imovel}</p>
        <p className="font-medium capitalize">{horario}</p>
        <p className="text-muted-foreground">O corretor vai confirmar com você.</p>
      </div>
    </div>
  );
}
