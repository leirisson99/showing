import { apagarFoto } from "@/lib/fotos";
import { perfis, type PerfilCorretor } from "@/mocks/corretor";
import type { Resultado } from "./imoveis";
import type { DadosPerfil } from "./perfil-schema";

// Perfil do corretor. Cada função recebe `corretorId` e mexe só no próprio perfil (RN-07).

export async function buscarPerfil(corretorId: string): Promise<PerfilCorretor | null> {
  return perfis().get(corretorId) ?? null;
}

/** Nome e CRECI aparecem na página pública: o painel os exige antes de publicar. */
export function perfilCompleto(p: Pick<PerfilCorretor, "nome" | "creci"> | null): boolean {
  return Boolean(p?.nome?.trim() && p?.creci?.trim());
}

function ordenar(horarios: DadosPerfil["horariosVisita"]): PerfilCorretor["horariosVisita"] {
  const saida: PerfilCorretor["horariosVisita"] = {};
  for (const [dia, lista] of Object.entries(horarios) as [keyof typeof saida, string[] | undefined][]) {
    if (lista && lista.length > 0) saida[dia] = [...lista].sort();
  }
  return saida;
}

export async function salvarPerfil(corretorId: string, dados: DadosPerfil): Promise<Resultado<{ perfil: PerfilCorretor }>> {
  const atual = perfis().get(corretorId);
  if (!atual) return { ok: false, erro: "Perfil não encontrado." };

  const perfil: PerfilCorretor = {
    ...atual,
    nome: dados.nome,
    creci: dados.creci,
    whatsapp: dados.whatsapp.replace(/\D/g, "") || null,
    horariosVisita: ordenar(dados.horariosVisita),
    duracaoVisitaMin: dados.duracaoVisitaMin,
  };
  perfis().set(corretorId, perfil);
  return { ok: true, perfil };
}

/** Troca a foto do perfil e apaga a anterior do storage. */
export async function definirFotoDoPerfil(corretorId: string, fileId: string): Promise<Resultado<{ anterior: string | null }>> {
  const atual = perfis().get(corretorId);
  if (!atual) return { ok: false, erro: "Perfil não encontrado." };
  perfis().set(corretorId, { ...atual, fotoFileId: fileId });
  if (atual.fotoFileId) await apagarFoto(atual.fotoFileId);
  return { ok: true, anterior: atual.fotoFileId };
}
