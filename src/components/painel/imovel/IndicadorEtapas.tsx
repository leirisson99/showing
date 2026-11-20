// Indicador de etapa do cadastro (pages.md §3.8): "Etapa 2 de 5" e barra de progresso.
export const ETAPAS = ["Dados", "Características", "Fotos", "Texto", "Revisão"] as const;

export function IndicadorEtapas({ atual }: { atual: number }) {
  const total = ETAPAS.length;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Progresso do cadastro">
      <p className="text-sm font-medium">
        Etapa {atual + 1} de {total} <span className="text-muted-foreground">· {ETAPAS[atual]}</span>
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={atual + 1}>
        <div className="h-full rounded-full bg-cta transition-[width] motion-reduce:transition-none" style={{ width: `${((atual + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
