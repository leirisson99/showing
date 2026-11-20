"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Retorno = { ok: true } | { ok: false; erro: string };

// Roda uma Server Action, mostra o toast (RN de feedback do pages.md, 1.3) e atualiza a tela.
export function useAcao() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  function rodar(acao: () => Promise<Retorno>, sucesso: string, aoConcluir?: () => void) {
    iniciar(async () => {
      try {
        const r = await acao();
        if (!r.ok) return void toast.error(r.erro);
        toast.success(sucesso);
        if (aoConcluir) aoConcluir();
        else router.refresh();
      } catch {
        toast.error("Algo deu errado. Tente de novo.");
      }
    });
  }

  return { rodar, pendente };
}
