import { apagarFoto } from "@/lib/fotos";
import type { Resultado } from "@/lib/painel/imoveis";
import { ordenarHorarios } from "@/lib/painel/perfil";
import type { DadosPerfil } from "@/lib/painel/perfil-schema";
import { perfis, type PerfilCorretor } from "./corretor";

// Versão em memória (USAR_MOCKS=1) de src/lib/painel/perfil.ts; a Prisma é perfil-db.ts.

export async function buscarPerfil(corretorId: string): Promise<PerfilCorretor | null> {
  return perfis().get(corretorId) ?? null;
}

export async function salvarPerfil(corretorId: string, dados: DadosPerfil): Promise<Resultado<{ perfil: PerfilCorretor }>> {
  const atual = perfis().get(corretorId);
  if (!atual) return { ok: false, erro: "Perfil não encontrado." };

  const perfil: PerfilCorretor = {
    ...atual,
    nome: dados.nome,
    creci: dados.creci,
    whatsapp: dados.whatsapp.replace(/\D/g, "") || null,
    horariosVisita: ordenarHorarios(dados.horariosVisita),
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
