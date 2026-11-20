"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink, MoreVertical, Pencil, Tag, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { excluirImovelAction, marcarVendidoAction } from "@/app/(painel)/painel/imoveis/actions";
import type { StatusImovel } from "@/lib/painel/tipos";
import { useAcao } from "./use-acao";
import { useCopiarLink } from "./use-copiar-link";

type Props = { id: string; titulo: string; slug: string; status: StatusImovel; urlPublica: string };

export function AcoesImovel({ id, titulo, slug, status, urlPublica }: Props) {
  const { rodar, pendente } = useAcao();
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const noAr = status !== "rascunho";

  const copiarLink = useCopiarLink(urlPublica);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-11" aria-label={`Ações do imóvel ${titulo}`} />}
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem render={<Link href={`/painel/imoveis/${id}`} />}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={noAr ? `/imovel/${slug}` : `/painel/imoveis/${id}/previa`} />}>
            <ExternalLink /> {noAr ? "Ver página" : "Pré-visualizar"}
          </DropdownMenuItem>
          {noAr && (
            <DropdownMenuItem onClick={copiarLink}>
              <Copy /> Copiar link
            </DropdownMenuItem>
          )}
          {status === "publicado" && (
            <DropdownMenuItem
              disabled={pendente}
              onClick={() => rodar(() => marcarVendidoAction(id), "Imóvel marcado como vendido")}
            >
              <Tag /> Marcar como vendido
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmarExclusao(true)}>
            <Trash2 /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              {titulo} e todas as fotos serão apagados e o link da página deixa de funcionar. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendente}
              onClick={() => rodar(() => excluirImovelAction(id), "Imóvel excluído")}
            >
              Excluir imóvel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
