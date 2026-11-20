"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { alterarStatusVisita } from "@/lib/painel/atendimentos";
import type { Resultado } from "@/lib/painel/imoveis";
import { avisarStatusDaVisita, disparar, notificacoesAtivas } from "@/lib/notificacoes";
import { exigirCorretor } from "@/lib/session";

const entrada = z.object({
  visitaId: z.string().min(1),
  status: z.enum(["confirmada", "realizada", "cancelada"]),
});

// RN-20: só o corretor muda o status. A visita precisa ser de um imóvel dele (RN-23).
export async function alterarStatusVisitaAction(visitaId: unknown, status: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = entrada.safeParse({ visitaId, status });
  if (!dados.success) return { ok: false, erro: "Pedido inválido." };

  const r = await alterarStatusVisita(corretor.id, dados.data.visitaId, dados.data.status);
  if (!r.ok) return r;
  const { visitaId: id, status: novo } = dados.data;
  if (notificacoesAtivas() && (novo === "confirmada" || novo === "cancelada")) disparar(() => avisarStatusDaVisita(id, novo));
  revalidatePath("/painel/visitas");
  revalidatePath("/painel/conversas");
  revalidatePath("/painel");
  return { ok: true };
}
