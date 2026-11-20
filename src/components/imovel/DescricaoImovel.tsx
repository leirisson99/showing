"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LIMITE_LEITURA = 320;

// No celular, textos longos ficam recolhidos em 6 linhas. O texto completo
// está sempre no HTML inicial (SEO); só o CSS recolhe.
export function DescricaoImovel({ texto }: { texto: string }) {
  const [aberta, setAberta] = useState(false);
  const longa = texto.length > LIMITE_LEITURA;

  return (
    <div className="flex flex-col items-start gap-2">
      <div
        id="descricao-texto"
        className={cn(
          "flex flex-col gap-3 leading-relaxed whitespace-pre-line",
          longa && !aberta && "line-clamp-6 lg:line-clamp-none",
        )}
      >
        {texto}
      </div>
      {longa && (
        <Button
          type="button"
          variant="link"
          aria-expanded={aberta}
          aria-controls="descricao-texto"
          onClick={() => setAberta((v) => !v)}
          className="h-11 px-0 lg:hidden"
        >
          {aberta ? "Ler menos" : "Ler mais"}
        </Button>
      )}
    </div>
  );
}
