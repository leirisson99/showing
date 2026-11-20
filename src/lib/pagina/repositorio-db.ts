import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { Roteiro } from "./roteiro";
import type { RelatorioRoteiro, VersaoDoRoteiro } from "./tipos";

// Roteiros no Prisma. Sem filtro de dono aqui: quem chama (servico.ts) já conferiu o imóvel.

type Linha = { id: string; imovelId: string; versao: number; conteudo: unknown; relatorio: unknown; aprovado: boolean; atualizadoEm: Date };
const paraVersao = (l: Linha): VersaoDoRoteiro => ({ ...l, conteudo: l.conteudo as Roteiro, relatorio: l.relatorio as RelatorioRoteiro });
const json = (v: unknown) => v as Prisma.InputJsonValue;

export async function ultimaVersao(imovelId: string): Promise<VersaoDoRoteiro | null> {
  const l = await db.roteiroPagina.findFirst({ where: { imovelId }, orderBy: { versao: "desc" } });
  return l ? paraVersao(l) : null;
}

export async function versaoAprovada(imovelId: string): Promise<VersaoDoRoteiro | null> {
  const l = await db.roteiroPagina.findFirst({ where: { imovelId, aprovado: true }, orderBy: { versao: "desc" } });
  return l ? paraVersao(l) : null;
}

export async function criarVersao(imovelId: string, conteudo: Roteiro, relatorio: RelatorioRoteiro): Promise<VersaoDoRoteiro> {
  // Duas gerações ao mesmo tempo podem pegar o mesmo número: o índice único recusa e tenta de novo.
  for (let tentativa = 0; ; tentativa++) {
    const ultima = await db.roteiroPagina.aggregate({ where: { imovelId }, _max: { versao: true } });
    try {
      const l = await db.roteiroPagina.create({ data: { imovelId, versao: (ultima._max.versao ?? 0) + 1, conteudo: json(conteudo), relatorio: json(relatorio) } });
      return paraVersao(l);
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") || tentativa >= 2) throw e;
    }
  }
}

export async function atualizarVersao(id: string, conteudo: Roteiro, relatorio: RelatorioRoteiro): Promise<void> {
  await db.roteiroPagina.update({ where: { id }, data: { conteudo: json(conteudo), relatorio: json(relatorio) } });
}

/** Só uma versão fica aprovada por imóvel: a que o comprador vê. */
export async function aprovarVersao(imovelId: string, id: string): Promise<void> {
  await db.$transaction([
    db.roteiroPagina.updateMany({ where: { imovelId, aprovado: true }, data: { aprovado: false } }),
    db.roteiroPagina.update({ where: { id }, data: { aprovado: true } }),
  ]);
}

export async function desaprovarTodas(imovelId: string): Promise<void> {
  await db.roteiroPagina.updateMany({ where: { imovelId, aprovado: true }, data: { aprovado: false } });
}
