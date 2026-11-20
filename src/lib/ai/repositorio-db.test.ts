import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { agendarVisita, listarHorarios, registrarLead, transferirCorretor, type ContextoAtendimento } from "./atendimento";
import { ConflitoDeHistorico, ConflitoDeVisita } from "./repositorio";

// Integração com o Postgres local: repositório do atendente e leituras do painel.
// Cria os próprios corretores e imóveis e apaga tudo no fim. Pula sem DATABASE_URL.

const temBanco = Boolean(process.env.DATABASE_URL);

// Quarta-feira, 18/11/2026, 12:00 em São Paulo (sábado 21/11 às 09:00 é o primeiro horário livre).
const AGORA = new Date("2026-11-18T12:00:00-03:00");
const SABADO_9H = new Date("2026-11-21T09:00:00-03:00");

describe.skipIf(!temBanco)("atendimento no Prisma", () => {
  let db: typeof import("@/lib/db").db;
  let repoDe: typeof import("./repositorio-db").criarRepositorioDb;
  let painel: typeof import("@/lib/painel/atendimentos-db");
  const sufixo = Date.now().toString(36);
  let dono = "", outro = "", imovelA = "", imovelB = "", imovelDoOutro = "";

  const novoImovel = (corretorId: string, slug: string) =>
    db.imovel.create({
      data: {
        corretorId, slug: `${slug}-${sufixo}`, tipo: "casa", finalidade: "venda", titulo: `Imóvel ${slug}`, descricao: "Descrição de teste.", bairro: "Teste",
        preco: 100000, quartos: 1, banheiros: 1, vagas: 0, areaM2: 50, aceitaFinanciamento: true, status: "publicado", publicadoEm: new Date(),
      },
      select: { id: true },
    });

  const ctxDe = (repo: ReturnType<typeof repoDe>, imovelId: string, conversaId: string): ContextoAtendimento => ({ imovelId, conversaId, repo, agora: () => AGORA });

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    ({ criarRepositorioDb: repoDe } = await import("./repositorio-db"));
    painel = await import("@/lib/painel/atendimentos-db");
    const horarios = { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] };
    dono = (await db.user.create({ data: { email: `dono-at-${sufixo}@teste.local`, name: "Dono", horariosVisita: horarios, duracaoVisitaMin: 60 } })).id;
    outro = (await db.user.create({ data: { email: `outro-at-${sufixo}@teste.local`, name: "Outro", horariosVisita: horarios } })).id;
    imovelA = (await novoImovel(dono, "a")).id;
    imovelB = (await novoImovel(dono, "b")).id;
    imovelDoOutro = (await novoImovel(outro, "c")).id;
  });

  afterAll(async () => {
    await db.imovel.deleteMany({ where: { corretorId: { in: [dono, outro] } } });
    await db.user.deleteMany({ where: { id: { in: [dono, outro] } } });
    await db.$disconnect();
  });

  it("segue o fluxo do atendente: horários, lead com consentimento e visita `pedida` (RN-11, RN-17, RN-20)", async () => {
    const repo = repoDe();
    const conversaId = await repo.criarConversa(imovelA);
    const ctx = ctxDe(repo, imovelA, conversaId);

    const lista = await listarHorarios(ctx, { imovel_id: imovelA });
    expect(lista.ok && (lista.horarios as { data_hora: string }[])[0].data_hora).toBe("2026-11-21T09:00:00-03:00");

    expect((await registrarLead(ctx, { imovel_id: imovelA, nome: "Maria Souza", telefone: "(47) 99999-0000", consentimento: true })).ok).toBe(true);
    const c = await repo.buscarConversa(conversaId);
    expect(c).toMatchObject({ consentimento: true, lead: { nome: "Maria Souza", telefone: "47999990000" } });

    const v = await agendarVisita(ctx, { imovel_id: imovelA, data_hora: "2026-11-21T09:00:00-03:00" });
    expect(v.ok && v.status).toBe("pedida");
    const dado = await db.visita.findFirstOrThrow({ where: { conversaId } });
    expect(dado).toMatchObject({ status: "pedida", corretorId: dono, imovelId: imovelA });
    expect(dado.dataHora.getTime()).toBe(SABADO_9H.getTime());

    // RN-19: uma visita por conversa.
    expect((await agendarVisita(ctx, { imovel_id: imovelA, data_hora: "2026-11-21T10:00:00-03:00" })).ok).toBe(false);
  });

  it("o horário pedido some das opções, inclusive para outro imóvel do mesmo corretor, e cancelar libera", async () => {
    const repo = repoDe();
    const ocupados = await repo.visitasOcupadas(imovelB);
    expect(ocupados.map((d) => d.getTime())).toContain(SABADO_9H.getTime());

    const visita = await db.visita.findFirstOrThrow({ where: { corretorId: dono, dataHora: SABADO_9H } });
    await db.visita.update({ where: { id: visita.id }, data: { status: "cancelada" } });
    expect((await repo.visitasOcupadas(imovelB)).map((d) => d.getTime())).not.toContain(SABADO_9H.getTime());
    await db.visita.update({ where: { id: visita.id }, data: { status: "pedida" } });
  });

  it("recusa no banco dois pedidos no mesmo horário do mesmo corretor", async () => {
    const repo = repoDe();
    const outraConversa = await repo.criarConversa(imovelB);
    await expect(repo.criarVisita({ imovelId: imovelB, conversaId: outraConversa, dataHora: SABADO_9H })).rejects.toBeInstanceOf(ConflitoDeVisita);

    // O mesmo horário em outro corretor é livre.
    const deOutro = await repo.criarConversa(imovelDoOutro);
    await expect(repo.criarVisita({ imovelId: imovelDoOutro, conversaId: deOutro, dataHora: SABADO_9H })).resolves.toHaveProperty("id");
  });

  it("a ferramenta devolve mensagem ao atendente quando o horário foi tomado entre a lista e o pedido", async () => {
    const repo = repoDe();
    const conversaId = await repo.criarConversa(imovelB);
    const ctx = ctxDe(repo, imovelB, conversaId);
    await registrarLead(ctx, { imovel_id: imovelB, nome: "João", email: "joao@exemplo.com", consentimento: true });
    // Lista livre simulada: o repositório diz que ninguém ocupa, mas o banco já tem o horário.
    const falso = { ...repo, visitasOcupadas: async () => [] };
    const r = await agendarVisita({ ...ctx, repo: falso }, { imovel_id: imovelB, data_hora: "2026-11-21T09:00:00-03:00" });
    expect(!r.ok && r.erro).toMatch(/acabou de ser pedido/);
  });

  it("não deixa duas respostas simultâneas sobrescreverem o histórico", async () => {
    const criador = repoDe();
    const id = await criador.criarConversa(imovelA);
    const a = repoDe();
    const b = repoDe();
    await a.mensagensDaConversa(id);
    await b.mensagensDaConversa(id);
    const fala = (texto: string) => [{ role: "user" as const, content: [{ text: texto }] }];
    await a.salvarMensagens(id, fala("primeira"));
    await expect(b.salvarMensagens(id, fala("segunda"))).rejects.toBeInstanceOf(ConflitoDeHistorico);
    expect(await repoDe().mensagensDaConversa(id)).toEqual(fala("primeira"));

    // Quem já gravou pode gravar de novo (a versão foi atualizada).
    await a.salvarMensagens(id, [...fala("primeira"), ...fala("terceira")]);
    expect((await repoDe().mensagensDaConversa(id)).length).toBe(2);
  });

  it("transferir acumula motivos e volta a pedir atenção", async () => {
    const repo = repoDe();
    const id = await repo.criarConversa(imovelA);
    await repo.salvarMensagens(id, [{ role: "user", content: [{ text: "Tem piscina?" }] }]);
    const ctx = ctxDe(repo, imovelA, id);
    await transferirCorretor(ctx, { imovel_id: imovelA, motivo: "Piscina" });
    await painel.marcarConversaLida(dono, id);
    expect((await painel.listarConversas(dono)).find((c) => c.id === id)?.naoLida).toBe(false);
    await transferirCorretor(ctx, { imovel_id: imovelA, motivo: "Condomínio" });
    const c = (await painel.listarConversas(dono)).find((x) => x.id === id)!;
    expect(c).toMatchObject({ naoLida: true, motivoTransferencia: "Piscina | Condomínio" });
  });

  it("o painel só mostra dado do dono e o contato só depois do consentimento (RN-11, RN-23)", async () => {
    const repo = repoDe();
    const id = await repo.criarConversa(imovelA);
    await repo.salvarMensagens(id, [{ role: "user", content: [{ text: "Oi" }] }, { role: "assistant", content: [{ text: "Olá!" }] }]);
    await db.conversa.update({ where: { id }, data: { perfilLead: { nome: "Sem Consentimento", telefone: "47911112222" }, consentimento: false } });

    const lista = await painel.listarConversas(dono);
    const c = lista.find((x) => x.id === id)!;
    expect(c.lead).toBeNull();
    expect(c).toMatchObject({ totalMensagens: 1, ultimaMensagem: "Olá!", imovelTitulo: "Imóvel a" });
    expect(JSON.stringify(await painel.listarConversas(outro))).not.toContain(id);

    expect(await painel.buscarConversaDoCorretor(outro, id)).toBeNull();
    const det = await painel.buscarConversaDoCorretor(dono, id);
    expect(det?.mensagens.map((m) => m.de)).toEqual(["atendente", "comprador", "atendente"]);
    expect(JSON.stringify(det)).not.toContain("47911112222");

    expect((await painel.marcarConversaLida(outro, id)).ok).toBe(false);
  });

  it("marcar como lida não muda a ordem da lista", async () => {
    const id = (await painel.listarConversas(dono)).find((c) => c.transferida)!.id;
    const antes = (await painel.listarConversas(dono)).find((c) => c.id === id)!.atualizadaEm;
    await painel.marcarConversaLida(dono, id);
    expect((await painel.listarConversas(dono)).find((c) => c.id === id)!.atualizadaEm).toEqual(antes);
  });

  it("visitas: só as do dono, transições válidas e sem pular etapa (RN-20)", async () => {
    const visitas = await painel.listarVisitas(dono);
    const v = visitas.find((x) => x.dataHora.getTime() === SABADO_9H.getTime())!;
    expect(v.comprador?.nome).toBe("Maria Souza");
    expect((await painel.listarVisitas(outro)).some((x) => x.id === v.id)).toBe(false);

    expect((await painel.alterarStatusVisita(outro, v.id, "confirmada")).ok).toBe(false);
    expect((await painel.alterarStatusVisita(dono, v.id, "realizada")).ok).toBe(false);
    expect(await painel.alterarStatusVisita(dono, v.id, "confirmada")).toEqual({ ok: true, status: "confirmada" });
    expect(await painel.alterarStatusVisita(dono, v.id, "realizada")).toEqual({ ok: true, status: "realizada" });
    expect((await painel.alterarStatusVisita(dono, v.id, "cancelada")).ok).toBe(false);
  });
});

describe.skipIf(!temBanco)("métricas no Prisma", () => {
  it("conta eventos e conversas só do dono, no período, sem dado pessoal (RF-12, RN-07)", async () => {
    const { db } = await import("@/lib/db");
    const m = await import("@/lib/painel/metricas-db");
    const sufixo = `m${Date.now().toString(36)}`;
    const dono = await db.user.create({ data: { email: `dono-${sufixo}@teste.local`, name: "Dono" } });
    const outro = await db.user.create({ data: { email: `outro-${sufixo}@teste.local`, name: "Outro" } });
    const base = { tipo: "casa", finalidade: "venda", descricao: "d", bairro: "T", preco: 1, quartos: 1, banheiros: 1, vagas: 0, areaM2: 1, aceitaFinanciamento: true } as const;
    const publicado = await db.imovel.create({ data: { ...base, corretorId: dono.id, slug: `m1-${sufixo}`, titulo: "M1", status: "publicado" } });
    const rascunho = await db.imovel.create({ data: { ...base, corretorId: dono.id, slug: `m2-${sufixo}`, titulo: "M2", status: "rascunho" } });
    const doOutro = await db.imovel.create({ data: { ...base, corretorId: outro.id, slug: `m3-${sufixo}`, titulo: "M3", status: "publicado" } });
    try {
      const conversa = await db.conversa.create({ data: { imovelId: publicado.id, mensagens: [{ role: "user", content: [{ text: "oi" }] }] } });
      await db.conversa.create({ data: { imovelId: publicado.id } }); // sem mensagem: não conta
      const agora = new Date();
      for (const t of ["visualizacao", "visualizacao", "contato_capturado", "visita_pedida"] as const) await m.registrarEvento(t, publicado.id, t === "visualizacao" ? null : conversa.id, agora);
      await m.registrarEvento("visualizacao", doOutro.id, null, agora);
      await m.registrarEvento("visualizacao", publicado.id, null, new Date(agora.getTime() - 40 * 24 * 60 * 60 * 1000)); // fora dos 30 dias

      expect(await m.registrarEvento("visualizacao", rascunho.id)).toBe(false); // rascunho não registra
      expect(await m.registrarEvento("visualizacao", "nao-existe")).toBe(false);

      expect(await m.metricasDoCorretor(dono.id, 30, agora)).toEqual({ visualizacoes: 2, conversas: 1, contatos: 1, visitas: 1 });
      const porImovel = await m.metricasPorImovel(dono.id, 30, agora);
      expect(porImovel.get(publicado.id)).toEqual({ visualizacoes: 2, conversas: 1, contatos: 1, visitas: 1 });
      expect(porImovel.get(rascunho.id)).toEqual({ visualizacoes: 0, conversas: 0, contatos: 0, visitas: 0 });
      expect(porImovel.has(doOutro.id)).toBe(false);
    } finally {
      await db.imovel.deleteMany({ where: { corretorId: { in: [dono.id, outro.id] } } });
      await db.user.deleteMany({ where: { id: { in: [dono.id, outro.id] } } });
    }
  });
});
