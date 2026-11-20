import type { MessageData } from "@strands-agents/sdk";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { HorariosVisita } from "./horarios";
import { ConflitoDeHistorico, ConflitoDeVisita, type ImovelDoAtendimento, type Lead, type RepositorioAtendimento } from "./repositorio";

// Repositório do atendente no Prisma (Conversa, Visita, User.horariosVisita). Cria uma instância
// por requisição: guarda a versão do histórico lida, para só gravar se ninguém gravou antes.
// Dados do comprador nunca vão para log (LGPD).

export function criarRepositorioDb(): RepositorioAtendimento {
  const versoes = new Map<string, number>();

  return {
    async buscarImovel(id): Promise<ImovelDoAtendimento | null> {
      return db.imovel.findUnique({ where: { id }, select: { id: true, status: true } });
    },

    async horariosDoCorretor(imovelId) {
      const i = await db.imovel.findUnique({ where: { id: imovelId }, select: { corretor: { select: { horariosVisita: true, duracaoVisitaMin: true } } } });
      return { horariosVisita: (i?.corretor.horariosVisita ?? {}) as HorariosVisita, duracaoMin: i?.corretor.duracaoVisitaMin ?? 60 };
    },

    // RN-17: só visitas pedidas ou confirmadas, de qualquer imóvel do mesmo corretor, ocupam horário.
    async visitasOcupadas(imovelId) {
      const i = await db.imovel.findUnique({ where: { id: imovelId }, select: { corretorId: true } });
      if (!i) return [];
      const visitas = await db.visita.findMany({
        where: { corretorId: i.corretorId, status: { in: ["pedida", "confirmada"] } },
        select: { dataHora: true },
      });
      return visitas.map((v) => v.dataHora);
    },

    async buscarConversa(id) {
      const c = await db.conversa.findUnique({ where: { id }, select: { id: true, imovelId: true, perfilLead: true, consentimento: true, transferida: true, visita: { select: { id: true } } } });
      if (!c) return null;
      return {
        id: c.id,
        imovelId: c.imovelId,
        lead: (c.perfilLead as Lead | null) ?? null,
        consentimento: c.consentimento,
        visitaId: c.visita?.id ?? null,
        transferida: c.transferida,
      };
    },

    // RN-11: só é chamado depois do consentimento.
    async salvarLead(conversaId, lead, consentimentoEm) {
      const atual = await db.conversa.findUnique({ where: { id: conversaId }, select: { perfilLead: true } });
      await db.conversa.update({
        where: { id: conversaId },
        data: { perfilLead: { ...((atual?.perfilLead as object | null) ?? {}), ...lead }, consentimento: true, consentimentoEm },
      });
    },

    // RN-20: toda visita nasce `pedida`. O índice único parcial recusa o mesmo horário do mesmo corretor.
    async criarVisita({ imovelId, conversaId, dataHora }) {
      const imovel = await db.imovel.findUniqueOrThrow({ where: { id: imovelId }, select: { corretorId: true } });
      try {
        const v = await db.visita.create({ data: { imovelId, conversaId, corretorId: imovel.corretorId, dataHora, status: "pedida" }, select: { id: true } });
        return { id: v.id };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflitoDeVisita(String(e.meta?.target).includes("conversaId") ? "conversa" : "horario");
        }
        throw e;
      }
    },

    async marcarTransferida(conversaId, motivo) {
      const c = await db.conversa.findUnique({ where: { id: conversaId }, select: { motivoTransferencia: true } });
      await db.conversa.update({
        where: { id: conversaId },
        // Nova transferência volta a pedir atenção do corretor.
        data: { transferida: true, lidaEm: null, motivoTransferencia: c?.motivoTransferencia ? `${c.motivoTransferencia} | ${motivo}` : motivo },
      });
    },

    async criarConversa(imovelId) {
      const c = await db.conversa.create({ data: { imovelId }, select: { id: true } });
      versoes.set(c.id, 0);
      return c.id;
    },

    async mensagensDaConversa(conversaId) {
      const c = await db.conversa.findUnique({ where: { id: conversaId }, select: { mensagens: true, versao: true } });
      versoes.set(conversaId, c?.versao ?? 0);
      return (c?.mensagens ?? []) as unknown as MessageData[];
    },

    // Só grava se a versão ainda é a lida: duas respostas simultâneas não se sobrescrevem.
    async salvarMensagens(conversaId, mensagens) {
      const r = await db.conversa.updateMany({
        where: { id: conversaId, versao: versoes.get(conversaId) ?? 0 },
        data: { mensagens: mensagens as unknown as Prisma.InputJsonValue, versao: { increment: 1 } },
      });
      if (r.count === 0) throw new ConflitoDeHistorico();
      versoes.set(conversaId, (versoes.get(conversaId) ?? 0) + 1);
    },
  };
}
