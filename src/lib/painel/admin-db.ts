import { db } from "@/lib/db";
import { usarMocks } from "@/lib/mocks";
import type { StatusImovel } from "@/generated/prisma/client";
import { POR_PAGINA, gastoPorCorretor, gastoPorDia, gastoPorTipo, porSemana, somarUso, type Gasto, type LinhaDeUso } from "./admin";

// Visão do admin: só agregações e dados do próprio corretor. Nada do comprador (nome, telefone, e-mail, mensagens).

const DIA_MS = 24 * 60 * 60 * 1000;
const DIAS = 30;
const SEMANAS = 8;

export type ResumoAdmin = {
  gasto: { dia7: Gasto; dia30: Gasto; total: Gasto };
  gastoPorDia: ({ dia: string } & Gasto)[];
  gastoPorTipo: ({ tipo: string } & Gasto)[];
  usuarios: {
    total: number;
    porSemana: { inicio: Date; total: number }[];
    lista: { id: string; nome: string | null; email: string; criadoEm: Date; imoveis: number; publicados: number; gasto30: Gasto }[];
    gastoSemDono: Gasto;
  };
  paginas: {
    porStatus: Record<StatusImovel, number>;
    porSemana: { inicio: Date; total: number }[];
    pagina: number;
    totalPaginas: number;
    recentes: { id: string; titulo: string; slug: string; status: StatusImovel; criadoEm: Date; corretor: string }[];
  };
  visitas30: number;
};

const zero: Gasto = { chamadas: 0, entrada: 0, saida: 0, custo: null };

export async function resumoAdmin(agora = new Date(), pagina = 1): Promise<ResumoAdmin> {
  if (usarMocks()) {
    return {
      gasto: { dia7: zero, dia30: zero, total: zero },
      gastoPorDia: gastoPorDia([], DIAS, agora),
      gastoPorTipo: [],
      usuarios: { total: 0, porSemana: porSemana([], SEMANAS, agora), lista: [], gastoSemDono: zero },
      paginas: { porStatus: { rascunho: 0, publicado: 0, vendido: 0 }, porSemana: porSemana([], SEMANAS, agora), pagina: 1, totalPaginas: 1, recentes: [] },
      visitas30: 0,
    };
  }

  const desde30 = new Date(agora.getTime() - DIAS * DIA_MS);
  const desde7 = new Date(agora.getTime() - 7 * DIA_MS);
  const desdeSemanas = new Date(agora.getTime() - SEMANAS * 7 * DIA_MS);

  const [uso30, totalUso, usuarios, imoveis, porStatus, recentes, visitas30] = await Promise.all([
    db.usoIA.findMany({
      where: { criadoEm: { gte: desde30 } },
      select: { tipo: true, imovelId: true, corretorId: true, entradaTokens: true, saidaTokens: true, criadoEm: true },
    }),
    db.usoIA.aggregate({ _count: { _all: true }, _sum: { entradaTokens: true, saidaTokens: true } }),
    db.user.findMany({ select: { id: true, name: true, email: true, criadoEm: true }, orderBy: { criadoEm: "desc" } }),
    db.imovel.findMany({ select: { id: true, corretorId: true, status: true, criadoEm: true } }),
    db.imovel.groupBy({ by: ["status"], _count: { _all: true } }),
    db.imovel.findMany({
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { id: true, titulo: true, slug: true, status: true, criadoEm: true, corretor: { select: { name: true, email: true } } },
    }),
    db.visita.count({ where: { criadaEm: { gte: desde30 } } }),
  ]);

  const linhas: LinhaDeUso[] = uso30;
  const donoDoImovel = new Map(imoveis.map((i) => [i.id, i.corretorId]));
  const porCorretor = gastoPorCorretor(linhas, donoDoImovel);
  const totalGasto = somarUso([{ entradaTokens: totalUso._sum.entradaTokens ?? 0, saidaTokens: totalUso._sum.saidaTokens ?? 0 }]);

  const status = { rascunho: 0, publicado: 0, vendido: 0 } satisfies Record<StatusImovel, number>;
  for (const s of porStatus) status[s.status] = s._count._all;

  return {
    gasto: {
      dia7: somarUso(linhas.filter((l) => l.criadoEm >= desde7)),
      dia30: somarUso(linhas),
      total: { ...totalGasto, chamadas: totalUso._count._all },
    },
    gastoPorDia: gastoPorDia(linhas, DIAS, agora),
    gastoPorTipo: gastoPorTipo(linhas),
    usuarios: {
      total: usuarios.length,
      porSemana: porSemana(usuarios.map((u) => u.criadoEm).filter((d) => d >= desdeSemanas), SEMANAS, agora),
      lista: usuarios.map((u) => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        criadoEm: u.criadoEm,
        imoveis: imoveis.filter((i) => i.corretorId === u.id).length,
        publicados: imoveis.filter((i) => i.corretorId === u.id && i.status === "publicado").length,
        gasto30: porCorretor.get(u.id) ?? zero,
      })),
      gastoSemDono: porCorretor.get(null) ?? zero,
    },
    paginas: {
      porStatus: status,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(imoveis.length / POR_PAGINA)),
      porSemana: porSemana(imoveis.map((i) => i.criadoEm).filter((d) => d >= desdeSemanas), SEMANAS, agora),
      recentes: recentes.map((i) => ({ id: i.id, titulo: i.titulo, slug: i.slug, status: i.status, criadoEm: i.criadoEm, corretor: i.corretor.name ?? i.corretor.email })),
    },
    visitas30,
  };
}
