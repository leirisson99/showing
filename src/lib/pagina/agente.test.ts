import { Model, type Message, type ModelStreamEvent } from "@strands-agents/sdk";
import { describe, expect, it, vi } from "vitest";
import { gerarRoteiroComIA } from "./agente";
import type { EntradaRoteiro } from "./entrada";
import { comAliasDeFotos, trocarIdsDeFotos } from "./fotos";
import { roteiroPadrao } from "./padrao";

vi.mock("@/lib/ai/uso", () => ({ registrarUso: async () => {} }));

class ModeloFalso extends Model {
  recebidas = 0;
  constructor(private roteiro: ModelStreamEvent[][]) {
    super();
  }
  updateConfig() {}
  getConfig() {
    return {};
  }
  async *stream(_: Message[]): AsyncGenerator<ModelStreamEvent> {
    void _;
    this.recebidas++;
    yield* this.roteiro.shift() ?? fala("pronto");
  }
}

const fala = (texto: string): ModelStreamEvent[] => [
  { type: "modelMessageStartEvent", role: "assistant" },
  { type: "modelContentBlockStartEvent" },
  { type: "modelContentBlockDeltaEvent", delta: { type: "textDelta", text: texto } },
  { type: "modelContentBlockStopEvent" },
  { type: "modelMessageStopEvent", stopReason: "endTurn" },
];
const chamar = (nome: string, entrada: object, id: string): ModelStreamEvent[] => [
  { type: "modelMessageStartEvent", role: "assistant" },
  { type: "modelContentBlockStartEvent", start: { type: "toolUseStart", name: nome, toolUseId: id } },
  { type: "modelContentBlockDeltaEvent", delta: { type: "toolUseInputDelta", input: JSON.stringify(entrada) } },
  { type: "modelContentBlockStopEvent" },
  { type: "modelMessageStopEvent", stopReason: "toolUse" },
];

const entrada: EntradaRoteiro = {
  imovel: {
    tipo: "casa", finalidade: "venda", bairro: "Itoupava Norte", cidade: "Blumenau", endereco: null, mostrarEndereco: false, preco: 650000, condominio: null, iptu: 1800,
    quartos: 3, suites: 1, banheiros: 2, vagas: 2, areaM2: 180, aceitaFinanciamento: true, aceitaFgts: false, caracteristicas: ["Quintal com churrasqueira"], infoAdicional: null,
    infoBairro: { escolas: ["Escola de exemplo A"], mercados: [], saude: [], distanciaCentro: "10 minutos" },
  },
  fotos: Array.from({ length: 9 }, (_, k) => ({ id: `foto-real-${k + 1}`, ordem: k, legenda: null })),
};

// O agente só enxerga f1..fN; este é o roteiro como ele o escreveria.
const comoOAgente = () => roteiroPadrao(comAliasDeFotos(entrada).entrada);

describe("Diretor da Página (agente)", () => {
  it("valida, salva e devolve o roteiro com os ids reais das fotos", async () => {
    const r = comoOAgente();
    const modelo = new ModeloFalso([chamar("validar_roteiro", { roteiro: r }, "t1"), chamar("salvar_rascunho", { roteiro: r }, "t2"), fala("pronto")]);
    const res = await gerarRoteiroComIA(entrada, { modelo });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.tentativas).toBe(1);
    expect(JSON.stringify(res.roteiro)).toContain("foto-real-1");
    expect(JSON.stringify(res.roteiro)).not.toMatch(/"f[0-9]+"/);
    expect(res.roteiro.capitulos[0].tipo).toBe("hero_imagem");
  });

  it("volta o erro ao agente, que corrige e segue (até 2 correções)", async () => {
    const ruim = comoOAgente();
    const h = ruim.capitulos[0];
    if (h.tipo === "hero_imagem") h.titulo.texto = "A melhor casa de 12 quartos";
    const bom = comoOAgente();
    const modelo = new ModeloFalso([chamar("validar_roteiro", { roteiro: ruim }, "t1"), chamar("validar_roteiro", { roteiro: bom }, "t2"), chamar("salvar_rascunho", { roteiro: bom }, "t3"), fala("pronto")]);
    const res = await gerarRoteiroComIA(entrada, { modelo });
    expect(res.ok && res.tentativas).toBe(2);
  });

  it("na terceira reprovação para, com a mensagem do spec", async () => {
    const ruim = comoOAgente();
    const h = ruim.capitulos[0];
    if (h.tipo === "hero_imagem") h.titulo.texto = "Casa imperdível";
    const modelo = new ModeloFalso([1, 2, 3, 4].map((n) => chamar("validar_roteiro", { roteiro: ruim }, `t${n}`)));
    const res = await gerarRoteiroComIA(entrada, { modelo });
    expect(res).toEqual({ ok: false, erro: "Não consegui montar a página. Tente de novo." });
  });

  it("salvar_rascunho não aceita roteiro inválido nem pula a validação", async () => {
    const ruim = comoOAgente();
    ruim.capitulos.pop();
    const modelo = new ModeloFalso([chamar("salvar_rascunho", { roteiro: ruim }, "t1"), fala("pronto")]);
    expect((await gerarRoteiroComIA(entrada, { modelo })).ok).toBe(false);
  });

  it("modelo que escreve o roteiro em texto, sem chamar ferramenta, não gera nada", async () => {
    const modelo = new ModeloFalso([fala(JSON.stringify(comoOAgente()))]);
    expect((await gerarRoteiroComIA(entrada, { modelo })).ok).toBe(false);
  });

  it("o prompt traz a ficha e as fotos em alias, sem id real nem endereço", async () => {
    const { montarPromptDiretor } = await import("./prompt");
    const p = montarPromptDiretor(comAliasDeFotos(entrada).entrada);
    expect(p).toContain("f1 (capa escolhida pelo corretor)");
    expect(p).toContain("imovel.quartos: 3");
    expect(p).toContain("Condomínio não preenchido");
    expect(p).not.toContain("foto-real");
    expect(p).toContain("REGRAS INEGOCIÁVEIS");
  });
});

describe("troca de ids de foto", () => {
  it("devolve os ids reais nos capítulos e nas fontes foto:fN", () => {
    const { entrada: alias, paraReal } = comAliasDeFotos(entrada);
    const r = trocarIdsDeFotos(roteiroPadrao({ ...alias, fotos: alias.fotos.map((f) => ({ ...f, legenda: "Sala" })) }), paraReal);
    const json = JSON.stringify(r);
    expect(json).toContain("foto:foto-real-2");
    expect(json).not.toMatch(/foto:f\d/);
  });
});
