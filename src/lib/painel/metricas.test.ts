import { beforeEach, describe, expect, it } from "vitest";
import { reiniciarAtendimentoMock, repositorioMockGlobal } from "@/mocks/atendimento";
import { eventos, reiniciarEventos } from "@/mocks/eventos";
import { reiniciarStore, store } from "@/mocks/painel";
import { metricasDoCorretor, metricasPorImovel, registrarEvento } from "./metricas";

const DONO = "mock-corretor";
const AGORA = new Date("2026-11-20T12:00:00-03:00");
const dias = (n: number) => new Date(AGORA.getTime() - n * 24 * 60 * 60 * 1000);

beforeEach(() => {
  reiniciarStore();
  reiniciarAtendimentoMock();
  reiniciarEventos();
});

describe("registrarEvento", () => {
  it("registra evento de imóvel publicado e recusa rascunho ou inexistente", async () => {
    expect(await registrarEvento("visualizacao", "mock-1", null, AGORA)).toBe(true);
    expect(await registrarEvento("visualizacao", "nao-existe", null, AGORA)).toBe(false);
    store().imoveis.find((i) => i.id === "mock-1")!.status = "rascunho";
    expect(await registrarEvento("visualizacao", "mock-1", null, AGORA)).toBe(false);
    expect(eventos()).toHaveLength(1);
  });

  it("o evento guarda só tipo, imóvel, conversa e hora (nada pessoal)", async () => {
    await registrarEvento("contato_capturado", "mock-1", "conversa-x", AGORA);
    expect(Object.keys(eventos()[0]).sort()).toEqual(["conversaId", "em", "imovelId", "tipo"]);
  });
});

describe("métricas", () => {
  it("soma por tipo, só do período e só dos imóveis do corretor (RN-07)", async () => {
    for (let i = 0; i < 3; i++) await registrarEvento("visualizacao", "mock-1", null, dias(1));
    await registrarEvento("visualizacao", "mock-1", null, dias(40)); // fora dos 30 dias
    await registrarEvento("contato_capturado", "mock-1", "c1", dias(2));
    await registrarEvento("visita_pedida", "mock-1", "c1", dias(2));

    const outro = { ...store().imoveis[0], id: "imovel-do-outro", slug: "outro", corretorId: "outro-corretor" };
    store().imoveis.push(outro);
    await registrarEvento("visualizacao", "imovel-do-outro", null, dias(1));

    const meu = await metricasDoCorretor(DONO, 30, AGORA);
    expect(meu).toMatchObject({ visualizacoes: 3, contatos: 1, visitas: 1 });
    expect((await metricasDoCorretor("outro-corretor", 30, AGORA)).visualizacoes).toBe(1);
    expect(await metricasDoCorretor("sem-imoveis", 30, AGORA)).toEqual({ visualizacoes: 0, conversas: 0, contatos: 0, visitas: 0 });
  });

  it("conta como conversa só a que teve mensagem do comprador", async () => {
    const repo = repositorioMockGlobal();
    const com = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(com, [{ role: "user", content: [{ text: "oi" }] }]);
    await repo.criarConversa("mock-1"); // aberta, sem mensagem
    expect((await metricasDoCorretor(DONO, 30, new Date())).conversas).toBe(1);
  });

  it("devolve um resumo por imóvel", async () => {
    await registrarEvento("visualizacao", "mock-1", null, dias(1));
    await registrarEvento("visualizacao", "mock-2", null, dias(1));
    await registrarEvento("visualizacao", "mock-2", null, dias(1));
    const porImovel = await metricasPorImovel(DONO, 30, AGORA);
    expect(porImovel.get("mock-1")?.visualizacoes).toBe(1);
    expect(porImovel.get("mock-2")?.visualizacoes).toBe(2);
  });
});
