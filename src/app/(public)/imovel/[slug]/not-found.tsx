import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ImovelNaoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Imóvel não encontrado</h1>
      <p className="text-muted-foreground">
        O link pode estar errado ou o imóvel não está mais disponível.
      </p>
      <Link href="/" className={cn(buttonVariants(), "h-11 px-4 text-base")}>
        Ir para o início
      </Link>
    </main>
  );
}
