import { cn } from "@/lib/utils";

type Props = {
  /** Rótulo pequeno em caixa alta acima do título. */
  rotulo?: string;
  titulo: string;
  descricao?: React.ReactNode;
  /** Botão ou ações à direita. */
  acao?: React.ReactNode;
  className?: string;
};

// Cabeçalho padrão das telas do painel, no estilo dos modelos (rótulo bronze, título leve).
export function CabecalhoPagina({ rotulo, titulo, descricao, acao, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {rotulo && <p className="text-sm font-semibold tracking-wide text-cta uppercase">{rotulo}</p>}
        <h1 className="text-3xl leading-tight font-medium text-balance md:text-4xl">{titulo}</h1>
        {descricao && <p className="max-w-2xl text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
