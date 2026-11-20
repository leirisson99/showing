"use server";

import { revalidatePath } from "next/cache";
import type { Resultado } from "@/lib/painel/imoveis";
import { listarImoveis } from "@/lib/painel/imoveis";
import { salvarPerfil } from "@/lib/painel/perfil";
import { perfilSchema } from "@/lib/painel/perfil-schema";
import { exigirCorretor } from "@/lib/session";

// Salva o perfil do corretor da sessão (RN-07). Nome, CRECI, WhatsApp e foto aparecem nas
// páginas públicas dos imóveis dele, então elas são revalidadas.
export async function salvarPerfilAction(entrada: unknown): Promise<Resultado> {
  const corretor = await exigirCorretor();
  const dados = perfilSchema.safeParse(entrada);
  if (!dados.success) return { ok: false, erro: dados.error.issues[0].message };

  const r = await salvarPerfil(corretor.id, dados.data);
  if (!r.ok) return r;

  revalidatePath("/painel/perfil");
  revalidatePath("/painel");
  for (const i of await listarImoveis(corretor.id)) {
    if (i.status !== "rascunho") revalidatePath(`/imovel/${i.slug}`);
  }
  return { ok: true };
}
