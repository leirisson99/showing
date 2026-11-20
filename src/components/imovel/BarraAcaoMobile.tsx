import { formatarPreco } from "@/lib/format";
import { BotaoChat } from "./BotaoChat";

// Barra fixa no rodapé do celular: preço + chamada principal.
export function BarraAcaoMobile({ preco }: { preco: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background px-4 py-3 lg:hidden">
      <p className="font-heading text-xl font-bold text-primary">{formatarPreco(preco)}</p>
      <BotaoChat modo="agendamento" variante="accent">
        Agendar visita
      </BotaoChat>
    </div>
  );
}
