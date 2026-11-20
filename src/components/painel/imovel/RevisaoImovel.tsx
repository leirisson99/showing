"use client";

import Link from "next/link";
import { Check, Circle, Eye, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { botaoContornoEscuro } from "@/components/site/estilos";
import { publicarImovelAction } from "@/app/(painel)/painel/imoveis/actions";
import { formatarArea, formatarPreco } from "@/lib/format";
import { TIPOS, type DadosImovel } from "@/lib/painel/schema";
import { useAcao } from "../use-acao";

type Props = {
  id: string;
  valores: DadosImovel;
  /** O que falta para publicar (RN-02); vazio = pronto. */
  falta: string[];
  perfilOk: boolean;
  /** Só rascunho se publica por aqui; os outros usam os botões do topo. */
  rascunho: boolean;
  irParaAba: (aba: "dados" | "texto" | "fotos") => void;
};

export function RevisaoImovel({ id, valores: v, falta, perfilOk, rascunho, irParaAba }: Props) {
  const { rodar, pendente } = useAcao();
  const pronto = falta.length === 0 && perfilOk;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="resumo" className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-5">
        <h3 id="resumo" className="text-lg font-medium">{v.titulo}</h3>
        <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Tipo</dt><dd className="font-medium">{TIPOS[v.tipo]} · {v.finalidade === "venda" ? "Venda" : "Aluguel"}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Local</dt><dd className="font-medium">{v.bairro}, {v.cidade}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Preço</dt><dd className="font-medium">{formatarPreco(v.preco)}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Medidas</dt><dd className="font-medium">{v.quartos} quartos · {v.banheiros} banheiros · {v.vagas} vagas · {formatarArea(v.areaM2)}</dd></div>
          {v.caracteristicas.length > 0 && (
            <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Características</dt><dd className="font-medium">{v.caracteristicas.join(", ")}</dd></div>
          )}
        </dl>
      </section>

      <section aria-labelledby="requisitos" className="flex flex-col gap-3">
        <h3 id="requisitos" className="text-lg font-medium">Para publicar</h3>
        <ul className="flex flex-col gap-2 text-[15px]">
          <li className="flex items-center gap-2"><Check className="size-4 text-ok" aria-hidden /> Dados da ficha completos</li>
          {falta.length === 0 ? (
            <li className="flex items-center gap-2"><Check className="size-4 text-ok" aria-hidden /> Fotos, título e descrição prontos</li>
          ) : (
            falta.map((f) => (
              <li key={f} className="flex flex-wrap items-center gap-2">
                <Circle className="size-4 text-aviso" aria-hidden /> Falta: {f}
                <button type="button" onClick={() => irParaAba(f.includes("foto") ? "fotos" : f.includes("título") || f.includes("descrição") ? "texto" : "dados")} className="min-h-11 text-sm underline underline-offset-4">
                  Ir para lá
                </button>
              </li>
            ))
          )}
          {perfilOk ? (
            <li className="flex items-center gap-2"><Check className="size-4 text-ok" aria-hidden /> Perfil com nome e CRECI</li>
          ) : (
            <li className="flex flex-wrap items-center gap-2">
              <Circle className="size-4 text-aviso" aria-hidden /> Falta completar o perfil (nome e CRECI){" "}
              <Link href="/painel/perfil" className="min-h-11 text-sm underline underline-offset-4">Abrir perfil</Link>
            </li>
          )}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/painel/imoveis/${id}/previa`} className={botaoContornoEscuro}>
          <Eye className="size-4" aria-hidden /> Pré-visualizar
        </Link>
        {rascunho && (
          <Button type="button" className="h-11 rounded-full px-6" disabled={pendente || !pronto} onClick={() => rodar(() => publicarImovelAction(id), "Imóvel publicado")}>
            <Globe data-icon="inline-start" /> Publicar imóvel
          </Button>
        )}
      </div>
    </div>
  );
}
