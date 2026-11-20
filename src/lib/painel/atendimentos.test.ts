import { beforeEach, describe, expect, it } from "vitest";
import { calcularHorariosLivres } from "@/lib/ai/horarios";
import { estadoAtendimentoMock, reiniciarAtendimentoMock, repositorioMockGlobal } from "@/mocks/atendimento";
import { reiniciarStore, store } from "@/mocks/painel";
import { alterarStatusVisita, buscarCliente, buscarConversaDoCorretor, listarClientes, listarConversas, listarVisitas } from "./atendimentos";

const DONO = "mock-corretor";
const OUTRO = "outro-corretor";

beforeEach(() => {
  reiniciarStore();
  reiniciarAtendimentoMock();
});

// Cria uma conversa com visita para o imóvel `imovelId` e devolve os ids.
async function visitaPara(imovelId: string, nome = "Maria (teste)") {
  const repo = repositorioMockGlobal();
  const conversaId = await repo.criarConversa(imovelId);
  await repo.salvarMensagens(conversaId, [
    { role: "user", content: [{ text: "Quero visitar" }] },
    { role: "assistant", content: [{ text: "Claro!" }] },
  ]);
  await repo.salvarLead(conversaId, { nome, telefone: "47999990000" }, new Date());
  const { id: visitaId } = await repo.criarVisita({ imovelId, conversaId, dataHora: new Date("2026-11-21T10:00:00-03:00") });
  return { conversaId, visitaId };
}

function imovelDoOutro() {
  const base = store().imoveis[0];
  const outro = { ...base, id: "imovel-do-outro", slug: "outro", corretorId: OUTRO, titulo: "Imóvel de outro corretor" };
  store().imoveis.push(outro);
  return outro.id;
}

describe("dono dos dados (RN-23, RNF-08)", () => {
  it("o corretor só vê visitas e conversas dos próprios imóveis", async () => {
    const meu = await visitaPara("mock-1", "Comprador do meu imóvel");
    const dele = await visitaPara(imovelDoOutro(), "Comprador do outro corretor");

    const minhas = await listarVisitas(DONO);
    expect(minhas.map((v) => v.id)).toContain(meu.visitaId);
    expect(minhas.map((v) => v.id)).not.toContain(dele.visitaId);
    expect(JSON.stringify(minhas)).not.toContain("outro corretor");

    const conversas = await listarConversas(DONO);
    expect(conversas.map((c) => c.id)).toContain(meu.conversaId);
    expect(conversas.map((c) => c.id)).not.toContain(dele.conversaId);

    expect((await listarVisitas(OUTRO)).map((v) => v.id)).toEqual([dele.visitaId]);
  });

  it("conversa de outro corretor se comporta como inexistente", async () => {
    const dele = await visitaPara(imovelDoOutro());
    expect(await buscarConversaDoCorretor(DONO, dele.conversaId)).toBeNull();
    expect(await buscarConversaDoCorretor(OUTRO, dele.conversaId)).not.toBeNull();
  });

  it("não altera visita de outro corretor", async () => {
    const dele = await visitaPara(imovelDoOutro());
    expect(await alterarStatusVisita(DONO, dele.visitaId, "confirmada")).toMatchObject({ ok: false });
    expect(estadoAtendimentoMock().visitas.find((v) => v.id === dele.visitaId)?.status).toBe("pedida");
  });
});

describe("status da visita (RN-20)", () => {
  it("nasce pedida e segue pedida → confirmada → realizada", async () => {
    const { visitaId } = await visitaPara("mock-1");
    expect((await listarVisitas(DONO)).find((v) => v.id === visitaId)?.status).toBe("pedida");
    expect(await alterarStatusVisita(DONO, visitaId, "confirmada")).toEqual({ ok: true, status: "confirmada" });
    expect(await alterarStatusVisita(DONO, visitaId, "realizada")).toEqual({ ok: true, status: "realizada" });
  });

  it("recusa saltos e mudanças depois de realizada ou cancelada", async () => {
    const { visitaId } = await visitaPara("mock-1");
    expect(await alterarStatusVisita(DONO, visitaId, "realizada")).toMatchObject({ ok: false });
    await alterarStatusVisita(DONO, visitaId, "cancelada");
    expect(await alterarStatusVisita(DONO, visitaId, "confirmada")).toMatchObject({ ok: false });
  });

  it("visita cancelada libera o horário para o atendente (RN-17)", async () => {
    const { visitaId } = await visitaPara("mock-1");
    const repo = repositorioMockGlobal();
    expect(await repo.visitasOcupadas("mock-1")).toHaveLength(1);
    await alterarStatusVisita(DONO, visitaId, "cancelada");
    expect(await repo.visitasOcupadas("mock-1")).toHaveLength(0);
    expect(calcularHorariosLivres({ horariosVisita: { sab: ["10:00"] }, duracaoMin: 60, ocupados: await repo.visitasOcupadas("mock-1"), agora: new Date("2026-11-18T12:00:00-03:00") })).toHaveLength(2);
  });
});

describe("conversas", () => {
  it("mostra o histórico lido (sem chamadas de ferramenta) e começa pela saudação", async () => {
    const { conversaId } = await visitaPara("mock-1");
    const repo = repositorioMockGlobal();
    await repo.salvarMensagens(conversaId, [
      { role: "user", content: [{ text: "Quero visitar" }] },
      { role: "assistant", content: [{ toolUse: { name: "listar_horarios", toolUseId: "t1", input: {} } }] },
      { role: "user", content: [{ toolResult: { toolUseId: "t1", status: "success", content: [{ json: { ok: true } }] } }] },
      { role: "assistant", content: [{ text: "Tenho sábado às 10h." }] },
    ]);
    const { mensagens, conversa } = (await buscarConversaDoCorretor(DONO, conversaId))!;
    expect(mensagens.map((m) => m.de)).toEqual(["atendente", "comprador", "atendente"]);
    expect(mensagens[0].texto).toContain("assistente virtual");
    expect(conversa.totalMensagens).toBe(1);
  });

  it("não mostra nome e contato sem consentimento (RN-11)", async () => {
    const repo = repositorioMockGlobal();
    const id = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(id, [{ role: "user", content: [{ text: "oi" }] }]);
    // Dado preenchido por engano, mas sem consentimento registrado:
    estadoAtendimentoMock().conversas.get(id)!.lead = { nome: "Sem consentimento" };
    const { conversa } = (await buscarConversaDoCorretor(DONO, id))!;
    expect(conversa.lead).toBeNull();
  });

  it("não lista conversas vazias e destaca as transferidas", async () => {
    const repo = repositorioMockGlobal();
    const vazia = await repo.criarConversa("mock-1");
    const transferida = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(transferida, [{ role: "user", content: [{ text: "Tem piscina?" }] }]);
    await repo.marcarTransferida(transferida, "Pergunta sobre piscina");

    const lista = await listarConversas(DONO);
    expect(lista.map((c) => c.id)).not.toContain(vazia);
    expect(lista.find((c) => c.id === transferida)).toMatchObject({ transferida: true, motivoTransferencia: "Pergunta sobre piscina" });
  });
});

describe("clientes", () => {
  it("junta conversas com o mesmo contato em um só cliente", async () => {
    const repo = repositorioMockGlobal();
    const a = await visitaPara("mock-1", "Maria Souza");
    const outra = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(outra, [{ role: "user", content: [{ text: "Oi de novo" }] }]);
    // Mesmo telefone, escrito de outro jeito, e um dado novo no perfil.
    await repo.salvarLead(outra, { nome: "Maria Souza", telefone: "(47) 99999-0000", prazo: "Até 2 meses" }, new Date());

    const clientes = await listarClientes(DONO);
    expect(clientes).toHaveLength(1);
    expect(clientes[0]).toMatchObject({ nome: "Maria Souza", prazo: "Até 2 meses", id: a.conversaId });
    expect(clientes[0].conversaIds).toHaveLength(2);
    expect(clientes[0].visitas).toHaveLength(1);
  });

  it("separa contatos diferentes e só inclui quem autorizou guardar os dados (RN-11)", async () => {
    const repo = repositorioMockGlobal();
    await visitaPara("mock-1", "Maria");
    const joao = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(joao, [{ role: "user", content: [{ text: "oi" }] }]);
    await repo.salvarLead(joao, { nome: "João", email: "joao@exemplo.com" }, new Date());
    const anonimo = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(anonimo, [{ role: "user", content: [{ text: "só olhando" }] }]);

    const nomes = (await listarClientes(DONO)).map((c) => c.nome).sort();
    expect(nomes).toEqual(["João", "Maria"]);
  });

  it("só enxerga os clientes dos próprios imóveis e o id não revela o contato (RN-23)", async () => {
    await visitaPara("mock-1", "Meu cliente");
    const dele = await visitaPara(imovelDoOutro(), "Cliente do outro");

    expect((await listarClientes(DONO)).map((c) => c.nome)).toEqual(["Meu cliente"]);
    expect(await buscarCliente(DONO, dele.conversaId)).toBeNull();
    expect(await buscarCliente(OUTRO, dele.conversaId)).not.toBeNull();
    for (const c of await listarClientes(DONO)) expect(c.id).not.toMatch(/47999990000|@/);
  });
});
