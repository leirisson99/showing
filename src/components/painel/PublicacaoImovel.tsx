"use client";

import Link from "next/link";
import { Copy, Eye, Globe, GlobeLock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { despublicarImovelAction, publicarImovelAction } from "@/app/(painel)/painel/imoveis/actions";
import { cn } from "@/lib/utils";
import type { StatusImovel } from "@/lib/painel/tipos";
import { AcoesImovel } from "./AcoesImovel";
import { BadgeStatus } from "./BadgeStatus";
import { useAcao } from "./use-acao";
import { useCopiarLink } from "./use-copiar-link";

type Props = {
  id: string;
  titulo: string;
  slug: string;
  status: StatusImovel;
  /** O que falta para publicar (RN-02); vazio = pronto. */
  falta: string[];
  urlPublica: string;
};

export function PublicacaoImovel({ id, titulo, slug, status, falta, urlPublica }: Props) {
  const { rodar, pendente } = useAcao();
  const noAr = status !== "rascunho";

  const copiar = useCopiarLink(urlPublica);

  return (
    <section aria-label="Publicação" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <BadgeStatus status={status} />
        {noAr && <span className="min-w-0 truncate text-sm text-muted-foreground">{urlPublica}</span>}
      </div>

      {!noAr && falta.length > 0 && (
        <p className="text-sm text-muted-foreground">Para publicar, falta: {falta.join(", ")}.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {noAr ? (
          <Button type="button" variant="outline" className="h-11" disabled={pendente} onClick={() => rodar(() => despublicarImovelAction(id), "Imóvel despublicado")}>
            <GlobeLock data-icon="inline-start" /> Despublicar
          </Button>
        ) : (
          <Button type="button" className="h-11" disabled={pendente || falta.length > 0} onClick={() => rodar(() => publicarImovelAction(id), "Imóvel publicado")}>
            <Globe data-icon="inline-start" /> Publicar imóvel
          </Button>
        )}
        <Link href={`/painel/imoveis/${id}/previa`} className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
          <Eye data-icon="inline-start" /> Pré-visualizar
        </Link>
        {noAr && (
          <Button type="button" variant="outline" className="h-11" onClick={copiar}>
            <Copy data-icon="inline-start" /> Copiar link
          </Button>
        )}
        <AcoesImovel id={id} titulo={titulo} slug={slug} status={status} urlPublica={urlPublica} />
      </div>
    </section>
  );
}
