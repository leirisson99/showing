import type { LucideIcon } from "lucide-react";

type Props = {
  rotulo: string;
  valor: number;
  Icone?: LucideIcon;
  /** Texto de apoio, ex.: "últimos 30 dias". */
  detalhe?: string;
};

// Número grande + rótulo (pages.md §2.5). Só contagens, nunca dado pessoal.
export function CartaoMetrica({ rotulo, valor, Icone, detalhe }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <p className="text-sm font-medium">{rotulo}</p>
        {Icone && <Icone className="size-5" aria-hidden />}
      </div>
      <p className="text-4xl leading-none font-medium tabular-nums">{new Intl.NumberFormat("pt-BR").format(valor)}</p>
      {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}
