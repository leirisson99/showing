"use client";

import { toast } from "sonner";

// Copia o link público do imóvel e avisa com um toast (usado no menu de ações e na publicação).
export function useCopiarLink(url: string) {
  return async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };
}
