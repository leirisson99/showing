"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { botaoEscuro } from "./estilos";

type Props = {
  titulo: string;
  texto: string;
  /** Função `reset` do error.tsx: tenta renderizar de novo. */
  aoTentarDeNovo?: () => void;
  voltar?: { href: string; rotulo: string };
};

// Tela de erro e de "não encontrado" no visual novo (pages.md §1.3: mensagem em português
// e botão "Tentar de novo"). Não mostra a mensagem técnica do erro.
export function TelaDeErro({ titulo, texto, aoTentarDeNovo, voltar }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-5 py-20 text-center" role="alert">
      <h1 className="text-3xl leading-tight font-medium">{titulo}</h1>
      <p className="text-muted-foreground">{texto}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {aoTentarDeNovo && (
          <Button type="button" onClick={aoTentarDeNovo} className="h-11 rounded-full px-6 text-sm font-semibold">
            Tentar de novo
          </Button>
        )}
        {voltar && (
          <Link href={voltar.href} className={botaoEscuro}>
            {voltar.rotulo}
          </Link>
        )}
      </div>
    </main>
  );
}
