import { apagarFoto } from "@/lib/fotos";
import { db } from "@/lib/db";
import type { HorariosVisita } from "@/lib/ai/horarios";
import type { PerfilCorretor } from "@/mocks/corretor";
import type { Resultado } from "./imoveis";
import { ordenarHorarios } from "./perfil";
import type { DadosPerfil } from "./perfil-schema";

// Perfil do corretor no Prisma (campos do User). Só o próprio perfil, pelo id da sessão (RN-07).

const campos = { id: true, email: true, name: true, creci: true, whatsapp: true, fotoFileId: true, horariosVisita: true, duracaoVisitaMin: true } as const;

type Linha = { id: string; email: string; name: string | null; creci: string | null; whatsapp: string | null; fotoFileId: string | null; horariosVisita: unknown; duracaoVisitaMin: number };

function paraPerfil(u: Linha): PerfilCorretor {
  return {
    id: u.id,
    email: u.email,
    nome: u.name,
    creci: u.creci,
    whatsapp: u.whatsapp,
    fotoFileId: u.fotoFileId,
    horariosVisita: (u.horariosVisita ?? {}) as HorariosVisita,
    duracaoVisitaMin: u.duracaoVisitaMin,
  };
}

export async function buscarPerfil(corretorId: string): Promise<PerfilCorretor | null> {
  const u = await db.user.findUnique({ where: { id: corretorId }, select: campos });
  return u ? paraPerfil(u) : null;
}

export async function salvarPerfil(corretorId: string, dados: DadosPerfil): Promise<Resultado<{ perfil: PerfilCorretor }>> {
  const existe = await db.user.findUnique({ where: { id: corretorId }, select: { id: true } });
  if (!existe) return { ok: false, erro: "Perfil não encontrado." };
  const u = await db.user.update({
    where: { id: corretorId },
    data: {
      name: dados.nome,
      creci: dados.creci,
      whatsapp: dados.whatsapp.replace(/\D/g, "") || null,
      horariosVisita: ordenarHorarios(dados.horariosVisita),
      duracaoVisitaMin: dados.duracaoVisitaMin,
    },
    select: campos,
  });
  return { ok: true, perfil: paraPerfil(u) };
}

export async function definirFotoDoPerfil(corretorId: string, fileId: string): Promise<Resultado<{ anterior: string | null }>> {
  const atual = await db.user.findUnique({ where: { id: corretorId }, select: { fotoFileId: true } });
  if (!atual) return { ok: false, erro: "Perfil não encontrado." };
  await db.user.update({ where: { id: corretorId }, data: { fotoFileId: fileId } });
  if (atual.fotoFileId) await apagarFoto(atual.fotoFileId);
  return { ok: true, anterior: atual.fotoFileId };
}
