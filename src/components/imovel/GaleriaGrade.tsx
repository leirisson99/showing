"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { FotoPublica } from "@/lib/imoveis";

const MAXIMO_NA_GRADE = 8;

// Grade de fotos do modelo 2. Cada foto abre em tela cheia, com setas e teclado.
export function GaleriaGrade({ fotos }: { fotos: FotoPublica[] }) {
  const [atual, setAtual] = useState(0);
  const [aberta, setAberta] = useState(false);
  const total = fotos.length;
  const anterior = () => setAtual((i) => (i - 1 + total) % total);
  const proxima = () => setAtual((i) => (i + 1) % total);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {fotos.slice(0, MAXIMO_NA_GRADE).map((f, i) => (
          <li key={f.src + i}>
            <button
              type="button"
              onClick={() => {
                setAtual(i);
                setAberta(true);
              }}
              aria-label={`Ampliar foto ${i + 1} de ${total}${f.legenda ? `: ${f.legenda}` : ""}`}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(min-width: 768px) 280px, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent
          className="max-w-[min(95vw,1100px)] sm:max-w-[min(95vw,1100px)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") anterior();
            if (e.key === "ArrowRight") proxima();
          }}
        >
          <DialogTitle className="sr-only">
            Foto {atual + 1} de {total}
          </DialogTitle>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted sm:aspect-video">
            <Image src={fotos[atual].src} alt={fotos[atual].alt} fill sizes="95vw" className="object-contain" />
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={anterior} className="h-11 rounded-full">
              <ChevronLeft data-icon="inline-start" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {atual + 1}/{total}
            </span>
            <Button type="button" variant="outline" onClick={proxima} className="h-11 rounded-full">
              Próxima
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
