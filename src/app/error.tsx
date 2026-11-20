"use client";

import { TelaDeErro } from "@/components/site/TelaDeErro";

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <TelaDeErro
      titulo="Algo deu errado"
      texto="Não foi possível carregar esta página. Tente de novo em instantes."
      aoTentarDeNovo={reset}
      voltar={{ href: "/", rotulo: "Ir para o início" }}
    />
  );
}
