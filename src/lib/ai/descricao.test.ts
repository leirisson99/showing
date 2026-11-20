import { describe, expect, it, vi } from "vitest";
import { gerarTituloEDescricao, type FichaDescricao } from "./descricao";

const ficha: FichaDescricao = {
  tipo: "apartamento",
  finalidade: "venda",
  bairro: "Garcia",
  cidade: "Blumenau",
  quartos: 2,
  suites: 1,
  banheiros: 1,
  vagas: 1,
  areaM2: 60,
  aceitaFinanciamento: true,
  aceitaFgts: false,
  caracteristicas: ["Sacada com churrasqueira"],
  infoAdicional: null,
};

describe("gerarTituloEDescricao (RN-06)", () => {
  it("usa só dados da ficha", async () => {
    const { titulo, descricao } = await gerarTituloEDescricao(ficha);
    expect(titulo).toBe("Apartamento de 2 quartos no Garcia");
    expect(descricao).toContain("2 quartos, sendo 1 suíte");
    expect(descricao).toContain("60 m² de área");
    expect(descricao).toContain("sacada com churrasqueira");
    expect(descricao).toContain("Aceita financiamento.");
    expect(descricao).not.toContain("FGTS");
  });

  it("não inventa quartos para terreno", async () => {
    const { titulo, descricao } = await gerarTituloEDescricao({ ...ficha, tipo: "terreno", quartos: 0, banheiros: 0, vagas: 0 });
    expect(titulo).toBe("Terreno no Garcia");
    expect(descricao).not.toMatch(/quarto|banheiro|vaga/);
  });
});

// --- Com IA: o texto do modelo só vale se usar apenas dados da ficha ---

import { Model, type Message, type ModelStreamEvent } from "@strands-agents/sdk";

class ModeloFalso extends Model {
  constructor(private saida: string | Error) {
    super();
  }
  updateConfig() {}
  getConfig() {
    return {};
  }
  async *stream(_: Message[]): AsyncGenerator<ModelStreamEvent> {
    void _;
    if (this.saida instanceof Error) throw this.saida;
    yield { type: "modelMessageStartEvent", role: "assistant" };
    yield { type: "modelContentBlockStartEvent" };
    yield { type: "modelContentBlockDeltaEvent", delta: { type: "textDelta", text: this.saida } };
    yield { type: "modelContentBlockStopEvent" };
    yield { type: "modelMessageStopEvent", stopReason: "endTurn" };
  }
}

const json = (titulo: string, descricao: string) => JSON.stringify({ titulo, descricao });
const PADRAO = "Apartamento de 2 quartos no Garcia";

describe("gerarTituloEDescricao com IA (RN-06)", () => {
  it("usa o texto do modelo quando ele respeita a ficha", async () => {
    const saida = json("Apartamento com sacada no Garcia", "Apartamento à venda no Garcia, em Blumenau, com 2 quartos e 60 m² de área.\n\nTem sacada com churrasqueira.");
    expect(await gerarTituloEDescricao(ficha, new ModeloFalso("```json\n" + saida + "\n```"))).toEqual({
      titulo: "Apartamento com sacada no Garcia",
      descricao: "Apartamento à venda no Garcia, em Blumenau, com 2 quartos e 60 m² de área.\n\nTem sacada com churrasqueira.",
    });
  });

  it("volta ao texto padrão se o modelo inventar número, preço, JSON inválido ou falhar", async () => {
    const invalidos: (string | Error)[] = [
      json("Apartamento no Garcia", "Apartamento com 3 quartos e 60 m² de área no Garcia, em Blumenau."), // 3 quartos: invenção
      json("Apartamento no Garcia", "Apartamento de 2 quartos e 75 m² de área no Garcia, em Blumenau."), // área errada
      json("Apartamento no Garcia", "Apartamento de 2 quartos por R$ 350.000 no Garcia, em Blumenau."), // preço
      "isso não é JSON",
      JSON.stringify({ titulo: "a", descricao: "curta" }),
      new Error("falha de rede"),
    ];
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const saida of invalidos) {
      expect((await gerarTituloEDescricao(ficha, new ModeloFalso(saida))).titulo).toBe(PADRAO);
    }
    log.mockRestore();
  });
});
