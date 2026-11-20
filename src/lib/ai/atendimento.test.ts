import { describe, expect, it } from "vitest";
import { criarRepositorioMock } from "@/mocks/atendimento";
import { agendarVisita, listarHorarios, registrarLead, transferirCorretor, type ContextoAtendimento } from "./atendimento";
import { criarTools } from "./tools";

// Quarta-feira, 18/11/2026, 12:00 em São Paulo.
const AGORA = new Date("2026-11-18T12:00:00-03:00");

function montar(opcoes: Parameters<typeof criarRepositorioMock>[0] = {}, imovelId = "mock-1", agora = AGORA) {
  const { repo, conversaId, estado } = criarRepositorioMock(opcoes);
  const ctx: ContextoAtendimento = { imovelId, conversaId, repo, agora: () => agora };
  return { ctx, estado };
}

const lead = { imovel_id: "mock-1", nome: "Maria Souza", telefone: "(47) 99999-0000", consentimento: true };

async function horarios(ctx: ContextoAtendimento) {
  const r = await listarHorarios(ctx, { imovel_id: ctx.imovelId });
  if (!r.ok) throw new Error(r.erro);
  return r.horarios as { data_hora: string; rotulo: string }[];
}

describe("listar_horarios", () => {
  it("devolve só os horários do corretor, em ordem, com fuso de São Paulo", async () => {
    const { ctx } = montar();
    const lista = await horarios(ctx);
    expect(lista.map((h) => h.data_hora)).toEqual([
      "2026-11-21T09:00:00-03:00",
      "2026-11-21T10:00:00-03:00",
      "2026-11-21T11:00:00-03:00",
      "2026-11-22T10:00:00-03:00",
      "2026-11-28T09:00:00-03:00",
      "2026-11-28T10:00:00-03:00",
      "2026-11-28T11:00:00-03:00",
      "2026-11-29T10:00:00-03:00",
    ]);
    expect(lista[0].rotulo).toBe("sábado, 21/11, às 09:00");
  });

  it("exige 12 horas de antecedência (RN-18)", async () => {
    // Sábado 00:00: 09h, 10h e 11h ficam a menos de 12 h.
    const { ctx } = montar({}, "mock-1", new Date("2026-11-21T00:00:00-03:00"));
    const lista = await horarios(ctx);
    expect(lista[0].data_hora).toBe("2026-11-22T10:00:00-03:00");
  });

  it("não passa de 14 dias à frente (RN-18)", async () => {
    const { ctx } = montar({ horariosVisita: { sab: ["09:00"] } });
    const lista = await horarios(ctx);
    // 21/11 e 28/11 entram; 05/12 está a 17 dias.
    expect(lista.map((h) => h.data_hora)).toEqual(["2026-11-21T09:00:00-03:00", "2026-11-28T09:00:00-03:00"]);
  });

  it("tira horários que conflitam com visitas pedidas ou confirmadas (RN-17)", async () => {
    const { ctx } = montar({ ocupados: [new Date("2026-11-21T10:00:00-03:00")] });
    const lista = (await horarios(ctx)).map((h) => h.data_hora);
    expect(lista).not.toContain("2026-11-21T10:00:00-03:00");
    expect(lista).toContain("2026-11-21T09:00:00-03:00");
    expect(lista).toContain("2026-11-21T11:00:00-03:00");
  });

  it("avisa quando não há horário livre", async () => {
    const { ctx } = montar({ horariosVisita: {} });
    const r = await listarHorarios(ctx, { imovel_id: "mock-1" });
    expect(r).toMatchObject({ ok: true, horarios: [] });
  });
});

describe("conferência do imóvel (RNF-07)", () => {
  it("recusa imóvel vendido", async () => {
    const { ctx } = montar({}, "mock-2");
    expect(await listarHorarios(ctx, { imovel_id: "mock-2" })).toMatchObject({ ok: false });
  });

  it("recusa imóvel que não existe", async () => {
    const { ctx } = montar({}, "nao-existe");
    expect(await listarHorarios(ctx, { imovel_id: "nao-existe" })).toMatchObject({ ok: false });
  });

  it("recusa imovel_id diferente do da conversa", async () => {
    const { ctx } = montar();
    expect(await listarHorarios(ctx, { imovel_id: "mock-2" })).toMatchObject({ ok: false });
  });

  it("recusa argumentos inválidos sem lançar erro", async () => {
    const { ctx } = montar();
    for (const entrada of [undefined, null, {}, { imovel_id: 42 }, "texto"]) {
      expect(await listarHorarios(ctx, entrada)).toMatchObject({ ok: false });
    }
  });
});

describe("registrar_lead", () => {
  it("grava nome e contato com consentimento", async () => {
    const { ctx, estado } = montar();
    expect(await registrarLead(ctx, lead)).toEqual({ ok: true });
    const c = estado.conversas.get(ctx.conversaId);
    expect(c?.consentimento).toBe(true);
    expect(c?.lead).toMatchObject({ nome: "Maria Souza", telefone: "47999990000" });
  });

  it("não grava sem consentimento (RN-11)", async () => {
    const { ctx, estado } = montar();
    for (const consentimento of [false, undefined, "sim"]) {
      expect(await registrarLead(ctx, { ...lead, consentimento })).toMatchObject({ ok: false });
    }
    expect(estado.conversas.get(ctx.conversaId)?.lead).toBeNull();
  });

  it("exige telefone ou e-mail", async () => {
    const { ctx } = montar();
    expect(await registrarLead(ctx, { imovel_id: "mock-1", nome: "Maria", consentimento: true })).toMatchObject({ ok: false });
  });

  it("recusa telefone e e-mail inválidos", async () => {
    const { ctx } = montar();
    expect(await registrarLead(ctx, { ...lead, telefone: "123" })).toMatchObject({ ok: false });
    expect(await registrarLead(ctx, { ...lead, telefone: undefined, email: "isso-nao-e-email" })).toMatchObject({ ok: false });
  });
});

describe("agendar_visita", () => {
  const livre = "2026-11-21T10:00:00-03:00";

  it("não agenda sem nome e contato registrados (RN-12)", async () => {
    const { ctx, estado } = montar();
    const r = await agendarVisita(ctx, { imovel_id: "mock-1", data_hora: livre });
    expect(r).toMatchObject({ ok: false });
    expect(estado.visitas).toHaveLength(0);
  });

  it("agenda em horário livre e a visita nasce pedida (RN-20)", async () => {
    const { ctx, estado } = montar();
    await registrarLead(ctx, lead);
    const r = await agendarVisita(ctx, { imovel_id: "mock-1", data_hora: livre });
    expect(r).toMatchObject({ ok: true, status: "pedida" });
    expect(estado.visitas).toHaveLength(1);
    expect(estado.visitas[0].dataHora.toISOString()).toBe(new Date(livre).toISOString());
  });

  it("recusa horário fora da lista (RN-17)", async () => {
    const { ctx, estado } = montar();
    await registrarLead(ctx, lead);
    for (const data_hora of [
      "2026-11-24T10:00:00-03:00", // terça: o corretor não atende
      "2026-11-21T03:00:00-03:00", // madrugada
      "2026-11-21T10:30:00-03:00", // meia hora fora da grade
      "2026-11-18T10:00:00-03:00", // passado
      "2026-12-05T09:00:00-03:00", // além de 14 dias
      "amanhã às 10",
    ]) {
      expect(await agendarVisita(ctx, { imovel_id: "mock-1", data_hora })).toMatchObject({ ok: false });
    }
    expect(estado.visitas).toHaveLength(0);
  });

  it("recusa horário já ocupado", async () => {
    const { ctx } = montar({ ocupados: [new Date(livre)] });
    await registrarLead(ctx, lead);
    expect(await agendarVisita(ctx, { imovel_id: "mock-1", data_hora: livre })).toMatchObject({ ok: false });
  });

  it("permite no máximo uma visita por conversa (RN-19)", async () => {
    const { ctx, estado } = montar();
    await registrarLead(ctx, lead);
    expect(await agendarVisita(ctx, { imovel_id: "mock-1", data_hora: livre })).toMatchObject({ ok: true });
    expect(
      await agendarVisita(ctx, { imovel_id: "mock-1", data_hora: "2026-11-21T11:00:00-03:00" }),
    ).toMatchObject({ ok: false });
    expect(estado.visitas).toHaveLength(1);
  });
});

describe("transferir_corretor", () => {
  it("marca a conversa como transferida e guarda a pergunta pendente", async () => {
    const { ctx, estado } = montar();
    expect(await transferirCorretor(ctx, { imovel_id: "mock-1", motivo: "Pergunta sobre piscina no prédio" })).toEqual({ ok: true });
    expect(estado.conversas.get(ctx.conversaId)?.transferida).toBe(true);
    expect(estado.motivos).toEqual(["Pergunta sobre piscina no prédio"]);
  });

  it("exige motivo", async () => {
    const { ctx, estado } = montar();
    expect(await transferirCorretor(ctx, { imovel_id: "mock-1", motivo: " " })).toMatchObject({ ok: false });
    expect(estado.conversas.get(ctx.conversaId)?.transferida).toBe(false);
  });
});

describe("tools do Strands", () => {
  it("expõe as quatro ferramentas com esquema JSON válido", () => {
    const { ctx } = montar();
    const tools = criarTools(ctx);
    expect(tools.map((t) => t.name)).toEqual(["listar_horarios", "registrar_lead", "agendar_visita", "transferir_corretor"]);
    for (const t of tools) expect(t.toolSpec.inputSchema).toBeDefined();
  });
});
