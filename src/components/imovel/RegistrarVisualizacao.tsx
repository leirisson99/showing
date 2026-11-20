"use client";

import { useEffect } from "react";
import { registrarEventoUmaVez } from "@/lib/eventos-cliente";

// Conta a visualização da página (uma vez por sessão). Não renderiza nada.
export function RegistrarVisualizacao({ imovelId }: { imovelId: string }) {
  useEffect(() => {
    registrarEventoUmaVez("visualizacao", imovelId);
  }, [imovelId]);
  return null;
}
