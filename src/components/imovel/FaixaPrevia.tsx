"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicarImovelAction } from "@/app/(painel)/painel/imoveis/actions";
import { useAcao } from "@/components/painel/use-acao";

type Props = { imovelId: string; rascunho: boolean; podePublicar: boolean };

// Faixa no topo da pré-visualização (pages.md §3.10): avisa que é uma prévia e dá a saída.
export function FaixaPrevia({ imovelId, rascunho, podePublicar }: Props) {
  const { rodar, pendente } = useAcao();
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-cta px-4 py-3 text-center text-cta-foreground">
      <p className="font-medium">
        {rascunho ? "Pré-visualização: esta página ainda não está publicada." : "Pré-visualização do que o comprador vê."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={`/painel/imoveis/${imovelId}`}
          className="inline-flex min-h-11 items-center rounded-full border border-white/60 px-5 text-sm font-semibold hover:bg-white hover:text-foreground"
        >
          Voltar ao editor
        </Link>
        {rascunho && (
          <Button
            type="button"
            className="h-11 rounded-full bg-white px-5 text-foreground hover:bg-white/90"
            disabled={pendente || !podePublicar}
            title={podePublicar ? undefined : "Falta algo para publicar: veja a aba Revisão."}
            onClick={() => rodar(() => publicarImovelAction(imovelId), "Imóvel publicado")}
          >
            <Globe data-icon="inline-start" /> Publicar
          </Button>
        )}
      </div>
    </div>
  );
}
