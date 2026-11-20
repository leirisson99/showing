import { describe, expect, it } from "vitest";
import { criarRepositorioMock } from "@/mocks/atendimento";
import { consultarHorarios, pedirVisita, salvarContato, transferirParaCorretor, type ContextoAtendimento } from "./atendimento";
import { criarTools } from "./tools";

// Quarta-feira, 18/11/2026, 12:00 em São Paulo.
const AGORA = new Date("2026-11-18T12:00:00-03:00");

function montar(opcoes: Parameters<typeof criarRepositorioMock>[0] = {}, imovelId = "mock-1", agora = AGORA) {
  const { repo, conversaId, estado } = criarRepositorioMock(opcoes);
  const ctx: ContextoAtendimento = { imovelId, conversaId, repo, agora: () => agora, corretorNome: "Ana Corretora" };
  return { ctx, estado, repo };
}

/** Os botões "Pode guardar" da bolha gravam o aceite no servidor, fora do modelo. */
async function aceitar(ctx: ContextoAtendimento) {
  await ctx.repo.registrarConsentimento(ctx.conversaId, true, AGORA);
}

const comprador = { nome: "Maria Souza", telefone: "(47) 99999-0000" };

async function horarios(ctx: ContextoAtendimento, entrada: unknown = {}) {
  const r = await consultarHorarios(ctx, entrada);
  if (!r.ok) throw new Error(r.erro);
  return r.horarios as { slot_id: string; dia: string; hora: string }[];
}

describe("consultar_horarios", () => {
  it("devolve até 6 horários do corretor, em ordem, com slot_id, dia e hora de São Paulo", async () => {
    const { ctx } = montar();
    const lista = await horarios(ctx);
    expect(lista).toHaveLength(6);
    expect(lista[0]).toEqual({ slot_id: "20261121-0900", dia: "sábado, 21/11", hora: "09:00" });
    expect(lista.map((h) => h.slot_id).slice(0, 4)).toEqual(["20261121-0900", "20261121-1000", "20261121-1100", "20261122-1000"]);
    expect(Object.keys(lista[0]).sort()).toEqual(["dia", "hora", "slot_id"]);
  });

  it("a_partir_de começa naquele dia", async () => {
    const { ctx } = montar();
    const lista = await horarios(ctx, { a_partir_de: "2026-11-28" });
    expect(lista[0].slot_id).toBe("20261128-0900");
    expect(lista.every((h) => h.slot_id >= "20261128")).toBe(true);
  });

  it("recusa data malformada sem lançar erro", async () => {
    const { ctx } = montar();
    expect(await consultarHorarios(ctx, { a_partir_de: "amanhã" })).toMatchObject({ ok: false });
  });

  it("exige 12 horas de antecedência (RN-18)", async () => {
    const { ctx } = montar({}, "mock-1", new Date("2026-11-21T00:00:00-03:00"));
    expect((await horarios(ctx))[0].slot_id).toBe("20261122-1000");
  });

  it("não passa de 14 dias à frente (RN-18)", async () => {
    const { ctx } = montar({ horariosVisita: { sab: ["09:00"] } });
    expect((await horarios(ctx)).map((h) => h.slot_id)).toEqual(["20261121-0900", "20261128-0900"]);
  });

  it("tira horários que conflitam com visitas pedidas ou confirmadas (RN-17)", async () => {
    const { ctx } = montar({ ocupados: [new Date("2026-11-21T10:00:00-03:00")] });
    const ids = (await horarios(ctx)).map((h) => h.slot_id);
    expect(ids).not.toContain("20261121-1000");
    expect(ids).toContain("20261121-0900");
  });

  it("avisa quando não há horário livre", async () => {
    const { ctx } = montar({ horariosVisita: {} });
    expect(await consultarHorarios(ctx, {})).toEqual({ ok: true, horarios: [], aviso: "Sem horários livres nos próximos dias" });
  });
});

describe("conferência do imóvel (RNF-07)", () => {
  it("recusa imóvel vendido e imóvel que não existe", async () => {
    expect(await consultarHorarios(montar({}, "mock-2").ctx, {})).toMatchObject({ ok: false });
    expect(await consultarHorarios(montar({}, "nao-existe").ctx, {})).toMatchObject({ ok: false });
  });

  it("recusa argumentos inválidos sem lançar erro", async () => {
    const { ctx } = montar();
    for (const entrada of ["texto", 42, { a_partir_de: 5 }]) {
      expect(await consultarHorarios(ctx, entrada)).toMatchObject({ ok: false });
    }
    for (const entrada of [undefined, null, {}, { slot_id: 1 }, "texto"]) {
      expect(await pedirVisita(ctx, entrada)).toMatchObject({ ok: false });
      expect(await transferirParaCorretor(ctx, entrada)).toMatchObject({ ok: false });
    }
  });
});

describe("salvar_contato", () => {
  it("grava os dados com o aceite registrado e junta chamadas seguidas", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    expect(await salvarContato(ctx, { nome: "Maria Souza", telefone: "(47) 99999-0000" })).toEqual({ ok: true, mensagem: "Contato salvo" });
    expect(await salvarContato(ctx, { email: "maria@exemplo.com", forma_pagamento: "financiamento", interesse: "2 quartos até 500 mil" })).toMatchObject({ ok: true });
    expect(estado.conversas.get(ctx.conversaId)?.lead).toEqual({
      nome: "Maria Souza",
      telefone: "47999990000",
      email: "maria@exemplo.com",
      pagamento: "financiamento",
      interesse: "2 quartos até 500 mil",
    });
  });

  it("não grava sem consentimento e manda o modelo não insistir (RN-11)", async () => {
    const { ctx, estado } = montar();
    const r = await salvarContato(ctx, comprador);
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.erro).toMatch(/^Sem consentimento: não salve dados\./);
    expect(!r.ok && r.erro).toMatch(/não insista/);
    expect(estado.conversas.get(ctx.conversaId)?.lead).toBeNull();
  });

  it("recusar nos botões desliga o aceite que já existia", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    await ctx.repo.registrarConsentimento(ctx.conversaId, false, AGORA);
    expect(await salvarContato(ctx, comprador)).toMatchObject({ ok: false });
    expect(estado.conversas.get(ctx.conversaId)?.consentimentoEm).toBeNull();
  });

  it("exige ao menos um dado e valida telefone e e-mail", async () => {
    const { ctx } = montar();
    await aceitar(ctx);
    for (const entrada of [{}, { telefone: "123" }, { email: "isso-nao-e-email" }, { forma_pagamento: "pix" }]) {
      expect(await salvarContato(ctx, entrada)).toMatchObject({ ok: false });
    }
  });

  it("dá um nome padrão quando só chega o telefone", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    await salvarContato(ctx, { telefone: "47999990000" });
    expect(estado.conversas.get(ctx.conversaId)?.lead?.nome).toBe("Comprador");
  });
});

describe("pedir_visita", () => {
  const slot = "20261121-1000";
  const pedido = { slot_id: slot, ...comprador };

  it("sem o aceite registrado não grava nada e manda o modelo pedir pelos botões (RN-11)", async () => {
    const { ctx, estado } = montar();
    const r = await pedirVisita(ctx, pedido);
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.erro).toMatch(/Sem consentimento/);
    expect(estado.visitas).toHaveLength(0);
    expect(estado.conversas.get(ctx.conversaId)?.lead).toBeNull();
  });

  it("pede a visita, guarda o comprador e ela nasce pedida (RN-20)", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    const r = await pedirVisita(ctx, { ...pedido, forma_pagamento: "FGTS", observacao: "Prefere de manhã" });
    expect(r).toMatchObject({ ok: true, status: "pedida", dia: "sábado, 21/11", hora: "10:00", horario: "sábado, 21/11, às 10:00" });
    expect(estado.visitas).toHaveLength(1);
    expect(estado.visitas[0]).toMatchObject({ status: "pedida" });
    expect(estado.visitas[0].dataHora.toISOString()).toBe(new Date("2026-11-21T10:00:00-03:00").toISOString());
    expect(estado.conversas.get(ctx.conversaId)?.lead).toMatchObject({ nome: "Maria Souza", telefone: "47999990000", pagamento: "FGTS" });
  });

  it("a resposta nunca diz que a visita está confirmada", async () => {
    const { ctx } = montar();
    await aceitar(ctx);
    const r = await pedirVisita(ctx, pedido);
    expect(JSON.stringify(r)).toMatch(/Ainda não está confirmado/);
  });

  it("recusa slot que não foi oferecido (RN-17, RN-18)", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    for (const slot_id of ["20261124-1000", "20261121-0300", "20261121-1030", "20261118-1000", "20261205-0900", "amanhã às 10", "2026-11-21T10:00:00-03:00"]) {
      expect(await pedirVisita(ctx, { ...pedido, slot_id })).toEqual({ ok: false, erro: "Horário ocupado, consulte os horários de novo." });
    }
    expect(estado.visitas).toHaveLength(0);
  });

  it("recusa horário já ocupado", async () => {
    const { ctx } = montar({ ocupados: [new Date("2026-11-21T10:00:00-03:00")] });
    await aceitar(ctx);
    expect(await pedirVisita(ctx, pedido)).toMatchObject({ ok: false, erro: "Horário ocupado, consulte os horários de novo." });
  });

  it("exige nome e telefone válidos", async () => {
    const { ctx } = montar();
    await aceitar(ctx);
    expect(await pedirVisita(ctx, { slot_id: slot, nome: "Maria" })).toMatchObject({ ok: false });
    expect(await pedirVisita(ctx, { ...pedido, telefone: "123" })).toMatchObject({ ok: false });
    expect(await pedirVisita(ctx, { ...pedido, forma_pagamento: "pix" })).toMatchObject({ ok: false });
  });

  it("permite no máximo uma visita por conversa (RN-19)", async () => {
    const { ctx, estado } = montar();
    await aceitar(ctx);
    expect(await pedirVisita(ctx, pedido)).toMatchObject({ ok: true });
    expect(await pedirVisita(ctx, { ...pedido, slot_id: "20261121-1100" })).toMatchObject({ ok: false });
    expect(estado.visitas).toHaveLength(1);
  });
});

describe("transferir_para_corretor", () => {
  it("marca a conversa como transferida com o motivo e o resumo e responde com o nome do corretor", async () => {
    const { ctx, estado } = montar();
    const r = await transferirParaCorretor(ctx, { motivo: "sem_resposta", resumo: "Quer saber se tem piscina no prédio" });
    expect(r).toEqual({ ok: true, mensagem: "Conversa transferida para Ana Corretora" });
    expect(estado.conversas.get(ctx.conversaId)?.transferida).toBe(true);
    expect(estado.motivos).toEqual(["Pergunta sem resposta na ficha: Quer saber se tem piscina no prédio"]);
  });

  it("aceita os quatro motivos e recusa outros", async () => {
    for (const motivo of ["sem_resposta", "pedido_do_comprador", "negociacao", "reclamacao"]) {
      expect(await transferirParaCorretor(montar().ctx, { motivo, resumo: "Resumo da conversa" })).toMatchObject({ ok: true });
    }
    const { ctx, estado } = montar();
    expect(await transferirParaCorretor(ctx, { motivo: "outro", resumo: "Resumo" })).toMatchObject({ ok: false });
    expect(await transferirParaCorretor(ctx, { motivo: "negociacao", resumo: " " })).toMatchObject({ ok: false });
    expect(estado.conversas.get(ctx.conversaId)?.transferida).toBe(false);
  });
});

describe("tools do Strands", () => {
  it("expõe as quatro ferramentas com esquema JSON válido e sem pedir o imóvel ao modelo", () => {
    const { ctx } = montar();
    const tools = criarTools(ctx);
    expect(tools.map((t) => t.name)).toEqual(["consultar_horarios", "pedir_visita", "salvar_contato", "transferir_para_corretor"]);
    for (const t of tools) {
      expect(t.toolSpec.inputSchema).toBeDefined();
      expect(JSON.stringify(t.toolSpec.inputSchema)).not.toContain("imovel_id");
    }
  });
});
