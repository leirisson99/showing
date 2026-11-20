import "dotenv/config";
import { render } from "@react-email/render";
import { createElement } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ConversaTransferida } from "@/emails/conversa-transferida";
import { PedidoRecebido } from "@/emails/pedido-recebido";
import { VisitaAtualizada } from "@/emails/visita-atualizada";
import { VisitaPedida } from "@/emails/visita-pedida";
import { pedirVisita, transferirParaCorretor, type ContextoAtendimento } from "@/lib/ai/atendimento";
import { criarRepositorioMock } from "@/mocks/atendimento";
import { disparar } from "./notificacoes";

const enviados: { para: string; assunto: string; template: unknown }[] = [];
vi.mock("@/lib/email", () => ({
  emailConfigurado: () => true,
  enviarEmail: vi.fn(async (e: { para: string; assunto: string; template: unknown }) => void enviados.push(e)),
}));

describe("templates", () => {
  it("mostram os campos e escapam HTML vindo do comprador", async () => {
    const html = await render(createElement(VisitaPedida, { imovel: "Casa", dataHora: "21/11, 09:00", comprador: "<script>alert(1)</script>", contato: "(47) 99999-0000", link: "https://x.test/painel" }));
    expect(html).toContain("Novo pedido de visita");
    expect(html).toContain("21/11, 09:00");
    expect(html).toContain("(47) 99999-0000");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("cada e-mail diz o que precisa", async () => {
    expect(await render(createElement(ConversaTransferida, { imovel: "Casa", motivo: "Piscina", link: "https://x.test" }))).toContain("Piscina");
    const recebido = await render(createElement(PedidoRecebido, { nome: "Maria", imovel: "Casa", dataHora: "09:00", corretor: "Ana", link: "https://x.test" }));
    expect(recebido).toContain("Ana vai confirmar");
    expect(await render(createElement(VisitaAtualizada, { nome: "Maria", imovel: "Casa", dataHora: "09:00", corretor: "Ana", situacao: "confirmada", link: "https://x.test" }))).toContain("foi confirmada");
    expect(await render(createElement(VisitaAtualizada, { nome: "Maria", imovel: "Casa", dataHora: "09:00", corretor: "Ana", situacao: "cancelada", link: "https://x.test" }))).toContain("foi cancelada");
  });
});

const COMPRADOR = { nome: "Maria", telefone: "(47) 99999-0000" };

describe("disparos", () => {
  const AGORA = new Date("2026-11-18T12:00:00-03:00");

  async function pronto(extra: Partial<ContextoAtendimento>) {
    const { repo, conversaId } = criarRepositorioMock();
    const ctx: ContextoAtendimento = { imovelId: "mock-1", conversaId, repo, agora: () => AGORA, ...extra };
    await repo.registrarConsentimento(conversaId, true, AGORA);
    return ctx;
  }

  it("agendar_visita e transferir_corretor chamam os ganchos depois de salvar", async () => {
    const aoPedirVisita = vi.fn();
    const aoTransferir = vi.fn();
    const ctx = await pronto({ aoPedirVisita, aoTransferir });
    const r = await pedirVisita(ctx, { ...COMPRADOR, slot_id: "20261121-0900" });
    expect(r.ok).toBe(true);
    expect(aoPedirVisita).toHaveBeenCalledWith(r.ok && r.visita_id);
    await transferirParaCorretor(ctx, { motivo: "sem_resposta", resumo: "Piscina no prédio" });
    expect(aoTransferir).toHaveBeenCalledWith(ctx.conversaId, "Pergunta sem resposta na ficha: Piscina no prédio");
  });

  it("não chama o gancho quando o agendamento é recusado", async () => {
    const aoPedirVisita = vi.fn();
    const ctx = await pronto({ aoPedirVisita });
    expect((await pedirVisita(ctx, { ...COMPRADOR, slot_id: "20261121-0300" })).ok).toBe(false);
    expect(aoPedirVisita).not.toHaveBeenCalled();
  });

  it("falha de envio não quebra nem desfaz a visita, e o log não leva dado pessoal", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const ctx = await pronto({ aoPedirVisita: () => disparar(async () => { throw new Error("SMTP caiu para maria@exemplo.com"); }) });
    const r = await pedirVisita(ctx, { ...COMPRADOR, slot_id: "20261121-0900" });
    expect(r.ok).toBe(true);
    await new Promise((res) => setTimeout(res, 10));
    expect(log).toHaveBeenCalledWith("e-mail: falha ao enviar", { tipo: "Error" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("maria@exemplo.com");
    log.mockRestore();
  });
});

describe.skipIf(!process.env.DATABASE_URL)("envio com dados do banco", () => {
  let db: typeof import("@/lib/db").db;
  let n: typeof import("./notificacoes");
  const sufixo = `n${Date.now().toString(36)}`;
  let corretorId = "", visitaId = "", conversaId = "";

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    n = await import("./notificacoes");
    corretorId = (await db.user.create({ data: { email: `corretor-${sufixo}@teste.local`, name: "Ana Corretora" } })).id;
    const imovel = await db.imovel.create({
      data: { corretorId, slug: `n-${sufixo}`, tipo: "casa", finalidade: "venda", titulo: "Casa Notificação", descricao: "d", bairro: "T", preco: 1, quartos: 1, banheiros: 1, vagas: 0, areaM2: 1, aceitaFinanciamento: true, status: "publicado" },
    });
    const c = await db.conversa.create({ data: { imovelId: imovel.id, perfilLead: { nome: "Maria", telefone: "47999990000", email: `maria-${sufixo}@teste.local` }, consentimento: true } });
    conversaId = c.id;
    visitaId = (await db.visita.create({ data: { imovelId: imovel.id, conversaId, corretorId, dataHora: new Date("2026-11-21T12:00:00Z") } })).id;
  });

  afterAll(async () => {
    await db.imovel.deleteMany({ where: { corretorId } });
    await db.user.delete({ where: { id: corretorId } });
    await db.$disconnect();
  });

  it("visita pedida avisa o corretor e confirma ao comprador", async () => {
    enviados.length = 0;
    await n.avisarVisitaPedida(visitaId);
    expect(enviados.map((e) => e.para)).toEqual([`corretor-${sufixo}@teste.local`, `maria-${sufixo}@teste.local`]);
    expect(enviados[0].assunto).toContain("Casa Notificação");
    const html = await render(enviados[0].template as never);
    expect(html).toContain("(47) 99999-0000"); // telefone formatado
    expect(html).toContain("09:00"); // 12:00Z = 09:00 em São Paulo
  });

  it("sem consentimento o contato do comprador não vai em e-mail nenhum", async () => {
    await db.conversa.update({ where: { id: conversaId }, data: { consentimento: false } });
    enviados.length = 0;
    await n.avisarVisitaPedida(visitaId);
    expect(enviados.map((e) => e.para)).toEqual([`corretor-${sufixo}@teste.local`]);
    expect(await render(enviados[0].template as never)).not.toContain("47999990000");
    await n.avisarStatusDaVisita(visitaId, "confirmada");
    expect(enviados).toHaveLength(1);
    await db.conversa.update({ where: { id: conversaId }, data: { consentimento: true } });
  });

  it("transferência avisa o corretor e status avisa o comprador", async () => {
    enviados.length = 0;
    await n.avisarTransferencia(conversaId, "Piscina");
    expect(enviados[0].para).toBe(`corretor-${sufixo}@teste.local`);
    expect(await render(enviados[0].template as never)).toContain("Piscina");

    enviados.length = 0;
    await n.avisarStatusDaVisita(visitaId, "cancelada");
    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toMatchObject({ para: `maria-${sufixo}@teste.local`, assunto: "Sua visita foi cancelada" });
  });
});
