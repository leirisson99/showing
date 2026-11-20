import type { MessageData } from "@strands-agents/sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { reiniciarAtendimentoMock, repositorioMockGlobal } from "@/mocks/atendimento";
import { anonimizarCliente, anonimizarConversa, buscarConversaDoCorretor, listarClientes, listarConversas } from "@/lib/painel/atendimentos";
import { anonimizarMensagens, redigirTexto, retencaoDias } from "./lgpd";

const lead = { nome: "Maria Souza", telefone: "47999990000", email: "maria@exemplo.com" };

describe("redigirTexto", () => {
  it("tira e-mail, telefone em vários formatos e o nome (inteiro ou por partes)", () => {
    const t = redigirTexto("Sou a Maria, meu e-mail é maria@exemplo.com e o zap (47) 99999-0000 ou +55 47 99999 0000. Abraço, SOUZA", lead);
    expect(t).not.toMatch(/maria|souza|@|9999/i);
    expect(t).toContain("[e-mail removido]");
    expect(t).toContain("[telefone removido]");
    expect(t).toContain("[nome removido]");
  });

  it("não mexe em preço, área nem em palavras que só contêm o nome", () => {
    const t = "O valor é R$ 480.000, são 68 m², 2 quartos e condomínio de R$ 520. Mariana e Souzalândia ficam como estão.";
    expect(redigirTexto(t, lead)).toBe(t);
  });

  it("sem lead ainda tira e-mail e telefone digitados no texto", () => {
    expect(redigirTexto("fala comigo no 47 98888-1111", null)).toBe("fala comigo no [telefone removido]");
  });
});

describe("anonimizarMensagens", () => {
  it("redige o texto e apaga os argumentos de registrar_lead, sem alterar o resto", () => {
    const m: MessageData[] = [
      { role: "user", content: [{ text: "Meu nome é Maria Souza, tel 47999990000" }] },
      { role: "assistant", content: [{ toolUse: { name: "registrar_lead", toolUseId: "1", input: { nome: "Maria Souza", telefone: "47999990000", consentimento: true } } }] },
      { role: "user", content: [{ toolResult: { toolUseId: "1", status: "success", content: [{ text: "ok para Maria" }] } }] },
      { role: "assistant", content: [{ toolUse: { name: "listar_horarios", toolUseId: "2", input: { imovel_id: "abc" } } }] },
    ];
    const saida = anonimizarMensagens(m, lead);
    const json = JSON.stringify(saida);
    expect(json).not.toMatch(/Maria|Souza|47999990000/);
    expect(saida[1].content[0]).toEqual({ toolUse: { name: "registrar_lead", toolUseId: "1", input: {} } });
    expect(saida[3]).toEqual(m[3]);
    expect(m[0].content[0]).toEqual({ text: "Meu nome é Maria Souza, tel 47999990000" }); // não altera a entrada
  });
});

describe("prazo de guarda", () => {
  it("padrão de 180 dias e RETENCAO_DIAS válido sobrescreve", () => {
    const antes = process.env.RETENCAO_DIAS;
    delete process.env.RETENCAO_DIAS;
    expect(retencaoDias()).toBe(180);
    process.env.RETENCAO_DIAS = "90";
    expect(retencaoDias()).toBe(90);
    process.env.RETENCAO_DIAS = "abc";
    expect(retencaoDias()).toBe(180);
    if (antes === undefined) delete process.env.RETENCAO_DIAS;
    else process.env.RETENCAO_DIAS = antes;
  });
});

describe("pedido de exclusão no painel (memória)", () => {
  const DONO = "mock-corretor";
  beforeAll(() => reiniciarAtendimentoMock());
  afterAll(() => reiniciarAtendimentoMock());

  async function conversaComContato(email: string) {
    const repo = repositorioMockGlobal();
    const id = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(id, [
      { role: "user", content: [{ text: `Sou a Maria Souza, ${email}` }] },
      { role: "assistant", content: [{ text: "Oi, Maria! Posso guardar seus dados?" }] },
    ]);
    await repo.salvarLead(id, { nome: "Maria Souza", email }, new Date());
    return id;
  }

  it("apaga contato e dado no texto, mantém a conversa e tira o cliente da lista (RN-24)", async () => {
    const id = await conversaComContato("maria.lgpd@exemplo.com");
    expect((await listarClientes(DONO)).some((c) => c.email === "maria.lgpd@exemplo.com")).toBe(true);

    expect(await anonimizarConversa(DONO, id)).toEqual({ ok: true });

    const d = await buscarConversaDoCorretor(DONO, id);
    expect(d?.conversa.lead).toBeNull();
    expect(d?.conversa.consentimentoEm).toBeNull();
    expect(d?.conversa.anonimizadaEm).toBeInstanceOf(Date);
    expect(d?.mensagens.length).toBe(3); // saudação + as duas mensagens continuam
    expect(JSON.stringify(d)).not.toMatch(/Maria Souza|maria\.lgpd@exemplo\.com/);
    expect((await listarConversas(DONO)).some((c) => c.id === id)).toBe(true);
    expect((await listarClientes(DONO)).some((c) => c.email === "maria.lgpd@exemplo.com")).toBe(false);
  });

  it("outro corretor não anonimiza (RN-23) e o cliente leva todas as conversas dele", async () => {
    const id = await conversaComContato("joao.lgpd@exemplo.com");
    expect((await anonimizarConversa("outro-corretor", id)).ok).toBe(false);
    expect((await buscarConversaDoCorretor(DONO, id))?.conversa.lead?.email).toBe("joao.lgpd@exemplo.com");

    const segunda = await conversaComContato("joao.lgpd@exemplo.com");
    const cliente = (await listarClientes(DONO)).find((c) => c.email === "joao.lgpd@exemplo.com")!;
    expect(cliente.conversaIds).toHaveLength(2);
    expect(await anonimizarCliente(DONO, cliente.id)).toEqual({ ok: true });
    for (const c of [id, segunda]) expect((await buscarConversaDoCorretor(DONO, c))?.conversa.lead).toBeNull();
    expect((await anonimizarCliente(DONO, cliente.id)).ok).toBe(false); // já não existe
  });
});
