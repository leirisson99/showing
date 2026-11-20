import type { Metadata } from "next";
import { FormImovel } from "@/components/painel/FormImovel";

export const metadata: Metadata = { title: "Novo imóvel — Showing", robots: { index: false } };

export default function NovoImovelPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Novo imóvel</h1>
      <p className="text-muted-foreground">Preencha os dados. As fotos entram no próximo passo, depois de salvar.</p>
      <FormImovel />
    </main>
  );
}
