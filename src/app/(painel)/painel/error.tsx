"use client";

import { TelaDeErro } from "@/components/site/TelaDeErro";

export default function ErroNoPainel({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <TelaDeErro
      titulo="Algo deu errado"
      texto="Não foi possível carregar esta tela. Seus dados estão salvos. Tente de novo."
      aoTentarDeNovo={reset}
      voltar={{ href: "/painel", rotulo: "Voltar ao painel" }}
    />
  );
}
