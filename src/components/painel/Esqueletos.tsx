import { Skeleton } from "@/components/ui/skeleton";

// Esqueletos no formato do conteúdo (pages.md §1.3), usados nos loading.tsx do painel.

const cartao = "rounded-3xl bg-card ring-1 ring-foreground/10";

function Titulo() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-8 w-48 rounded-full" />
      <Skeleton className="h-4 w-80 max-w-full rounded-full" />
    </div>
  );
}

function Carregando({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8" aria-busy="true" aria-label="Carregando">
      {children}
    </main>
  );
}

export function EsqueletoPagina() {
  return (
    <Carregando>
      <Titulo />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </Carregando>
  );
}

export function EsqueletoLista() {
  return (
    <Carregando>
      <Titulo />
      <Skeleton className="h-11 w-full max-w-sm rounded-full" />
      <ul className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={`${cartao} flex items-center gap-3 p-3`}>
            <Skeleton className="size-20 shrink-0 rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3 rounded-full" />
              <Skeleton className="h-4 w-1/3 rounded-full" />
              <Skeleton className="h-4 w-1/4 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </Carregando>
  );
}

export function EsqueletoFormulario() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8" aria-busy="true" aria-label="Carregando">
      <Titulo />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-11 w-48 rounded-full" />
    </main>
  );
}
