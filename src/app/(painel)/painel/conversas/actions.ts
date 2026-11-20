"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { marcarConversaLida } from "@/lib/painel/atendimentos";
import type { Resultado } from "@/lib/painel/imoveis";
import { exigirCorretor } from "@/lib/session";

// Só o corretor dono do imóvel marca a transferência como lida (RN-23).
export async function marcarConversaLidaAction(conversaId: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = z.string().min(1).safeParse(conversaId);
  if (!dados.success) return { ok: false, erro: "Conversa inválida." };

  const r = await marcarConversaLida(corretor.id, dados.data);
  if (!r.ok) return r;
  revalidatePath("/painel");
  revalidatePath("/painel/conversas");
  revalidatePath(`/painel/conversas/${dados.data}`);
  return { ok: true };
}
