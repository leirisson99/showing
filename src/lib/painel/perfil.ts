import { usarMocks } from "@/lib/mocks";
import type { PerfilCorretor } from "@/mocks/corretor";
import type { Resultado } from "./imoveis";
import type { DadosPerfil } from "./perfil-schema";

// Perfil do corretor. Cada função recebe `corretorId` e mexe só no próprio perfil (RN-07).
// Com USAR_MOCKS=1 usa a memória (src/mocks/painel-perfil.ts); senão, o Prisma (perfil-db.ts).

const repo = async () => (usarMocks() ? await import("@/mocks/painel-perfil") : await import("./perfil-db"));

export async function buscarPerfil(corretorId: string): Promise<PerfilCorretor | null> {
  return (await repo()).buscarPerfil(corretorId);
}

export async function salvarPerfil(corretorId: string, dados: DadosPerfil): Promise<Resultado<{ perfil: PerfilCorretor }>> {
  return (await repo()).salvarPerfil(corretorId, dados);
}

/** Troca a foto do perfil e apaga a anterior do storage. */
export async function definirFotoDoPerfil(corretorId: string, fileId: string): Promise<Resultado<{ anterior: string | null }>> {
  return (await repo()).definirFotoDoPerfil(corretorId, fileId);
}

/** Nome e CRECI aparecem na página pública: o painel os exige antes de publicar. */
export function perfilCompleto(p: Pick<PerfilCorretor, "nome" | "creci"> | null): boolean {
  return Boolean(p?.nome?.trim() && p?.creci?.trim());
}

export function ordenarHorarios(horarios: DadosPerfil["horariosVisita"]): PerfilCorretor["horariosVisita"] {
  const saida: PerfilCorretor["horariosVisita"] = {};
  for (const [dia, lista] of Object.entries(horarios) as [keyof typeof saida, string[] | undefined][]) {
    if (lista && lista.length > 0) saida[dia] = [...lista].sort();
  }
  return saida;
}
