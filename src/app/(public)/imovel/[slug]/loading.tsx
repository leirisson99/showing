import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoImovel() {
  return (
    <div aria-busy="true" aria-label="Carregando o imóvel" className="flex flex-1 flex-col">
      <Skeleton className="h-[640px] w-full rounded-none bg-deep/20 md:h-[720px]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-16">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-full max-w-xl rounded-full" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-full" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
      </div>
    </div>
  );
}
