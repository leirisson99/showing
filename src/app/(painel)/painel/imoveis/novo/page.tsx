import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { NovoImovel } from "@/components/painel/imovel/NovoImovel";

export const metadata: Metadata = { title: "Novo imóvel — Showing", robots: { index: false } };

export default function NovoImovelPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <CabecalhoPagina
        rotulo="Cadastro"
        titulo="Novo imóvel"
        descricao="Comece pelos dados. Ao salvar, o imóvel vira rascunho e você segue para características, fotos e texto, quando quiser."
      />
      <NovoImovel />
    </main>
  );
}
