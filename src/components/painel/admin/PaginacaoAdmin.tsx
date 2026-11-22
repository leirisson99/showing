import Link from "next/link";
import { cn } from "@/lib/utils";

const classe = "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-foreground/10 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

// Anterior / próxima por ?pagina=N. Server Component: só links, sem estado.
export function PaginacaoAdmin({ pagina, totalPaginas }: { pagina: number; totalPaginas: number }) {
  if (totalPaginas <= 1) return null;
  const href = (n: number) => (n === 1 ? "/painel/admin" : `/painel/admin?pagina=${n}`);
  return (
    <nav aria-label="Paginação dos imóveis" className="flex items-center justify-between gap-2">
      {pagina > 1 ? <Link href={href(pagina - 1)} className={classe}>Anterior</Link> : <span aria-hidden className={cn(classe, "invisible")}>Anterior</span>}
      <p className="text-sm text-muted-foreground" aria-live="polite">Página {Math.min(pagina, totalPaginas)} de {totalPaginas}</p>
      {pagina < totalPaginas ? <Link href={href(pagina + 1)} className={classe}>Próxima</Link> : <span aria-hidden className={cn(classe, "invisible")}>Próxima</span>}
    </nav>
  );
}
