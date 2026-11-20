"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { legendarFotoAction, moverFotoAction, removerFotoAction } from "@/app/(painel)/painel/imoveis/actions";
import { FOTO_MAX_BYTES, FOTO_TIPOS, FOTOS_MINIMAS } from "@/lib/painel/schema";
import { cn } from "@/lib/utils";
import { useAcao } from "./use-acao";

export type FotoItem = { id: string; src: string; legenda: string | null };

export function UploadFotos({ imovelId, fotos }: { imovelId: string; fotos: FotoItem[] }) {
  const router = useRouter();
  const { rodar, pendente } = useAcao();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState<{ atual: number; total: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  async function enviar(arquivos: File[]) {
    if (arquivos.length === 0) return;
    let enviadas = 0;
    for (const [i, arquivo] of arquivos.entries()) {
      setEnviando({ atual: i + 1, total: arquivos.length });
      // Conferência rápida no cliente; o servidor valida de novo (tipo, tamanho e conteúdo).
      if (!(FOTO_TIPOS as readonly string[]).includes(arquivo.type)) {
        toast.error(`${arquivo.name}: use JPG, PNG ou WebP.`);
        continue;
      }
      if (arquivo.size > FOTO_MAX_BYTES) {
        toast.error(`${arquivo.name}: o limite é 10 MB.`);
        continue;
      }
      const corpo = new FormData();
      corpo.set("imovelId", imovelId);
      corpo.set("arquivo", arquivo);
      try {
        const resposta = await fetch("/api/upload", { method: "POST", body: corpo });
        if (resposta.ok) enviadas++;
        else toast.error(`${arquivo.name}: ${(await resposta.json().catch(() => null))?.erro ?? "falha no envio."}`);
      } catch {
        toast.error(`${arquivo.name}: falha de conexão.`);
      }
    }
    setEnviando(null);
    if (entrada.current) entrada.current.value = "";
    if (enviadas > 0) {
      toast.success(enviadas === 1 ? "Foto enviada" : `${enviadas} fotos enviadas`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void enviar([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center",
          arrastando && "border-primary bg-muted",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Arraste as fotos aqui ou escolha no aparelho. JPG, PNG ou WebP, até 10 MB cada.</p>
        <input
          ref={entrada}
          id="fotos"
          type="file"
          multiple
          accept={FOTO_TIPOS.join(",")}
          className="sr-only"
          onChange={(e) => void enviar([...(e.target.files ?? [])])}
        />
        <Button type="button" className="h-11" disabled={enviando !== null} onClick={() => entrada.current?.click()}>
          {enviando ? `Enviando ${enviando.atual} de ${enviando.total}…` : "Escolher fotos"}
        </Button>
      </div>

      <p className={cn("text-sm", fotos.length < FOTOS_MINIMAS ? "text-destructive" : "text-muted-foreground")}>
        {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}. Mínimo de {FOTOS_MINIMAS} para publicar. A primeira é a capa.
      </p>

      {fotos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto, i) => (
            <li key={foto.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image src={foto.src} alt={foto.legenda ?? `Foto ${i + 1}`} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Capa</span>
                )}
              </div>
              <Input
                key={`${foto.id}-${foto.legenda}`}
                aria-label={`Legenda da foto ${i + 1}`}
                placeholder="Legenda (vira o texto alternativo)"
                maxLength={200}
                defaultValue={foto.legenda ?? ""}
                className="h-11"
                onBlur={(e) => {
                  if (e.target.value.trim() !== (foto.legenda ?? "")) {
                    rodar(() => legendarFotoAction(imovelId, foto.id, e.target.value), "Legenda salva");
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="icon" className="size-11" disabled={pendente || i === 0} aria-label={`Mover foto ${i + 1} para a esquerda`} onClick={() => rodar(() => moverFotoAction(imovelId, foto.id, -1), "Ordem atualizada")}>
                    <ArrowLeft />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="size-11" disabled={pendente || i === fotos.length - 1} aria-label={`Mover foto ${i + 1} para a direita`} onClick={() => rodar(() => moverFotoAction(imovelId, foto.id, 1), "Ordem atualizada")}>
                    <ArrowRight />
                  </Button>
                </div>
                <Button type="button" variant="destructive" size="icon" className="size-11" disabled={pendente} aria-label={`Remover foto ${i + 1}`} onClick={() => rodar(() => removerFotoAction(imovelId, foto.id), "Foto removida")}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
