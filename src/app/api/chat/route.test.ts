import { Model, type Message, type ModelStreamEvent } from "@strands-agents/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obterRepositorio } from "@/lib/ai/repositorio-atual";
import { reiniciarLimites } from "@/lib/rate-limit";
import { reiniciarStore } from "@/mocks/painel";

// Modelo de IA falso: devolve um roteiro de respostas, sem rede nem chave.
const estado = vi.hoisted(() => ({ configurada: true, modelo: null as unknown }));
vi.mock("@/lib/ai/modelo", () => ({
  iaConfigurada: () => estado.configurada,
  criarModelo: () => estado.modelo,
}));

import { POST } from "./route";

class ModeloFalso extends Model {
  recebidas: Message[][] = [];
  constructor(private roteiro: (ModelStreamEvent[] | Error)[]) {
    super();
  }
  updateConfig() {}
  getConfig() {
    return {};
  }
  async *stream(mensagens: Message[]): AsyncGenerator<ModelStreamEvent> {
    this.recebidas.push([...mensagens]);
    const passo = this.roteiro.shift() ?? resposta("(sem roteiro)");
    if (passo instanceof Error) throw passo;
    yield* passo;
  }
}

const resposta = (texto: string): ModelStreamEvent[] => [
  { type: "modelMessageStartEvent", role: "assistant" },
  { type: "modelContentBlockStartEvent" },
  { type: "modelContentBlockDeltaEvent", delta: { type: "textDelta", text: texto } },
  { type: "modelContentBlockStopEvent" },
  { type: "modelMessageStopEvent", stopReason: "endTurn" },
];

const chamarFerramenta = (nome: string, entrada: object, id = "t1"): ModelStreamEvent[] => [
  { type: "modelMessageStartEvent", role: "assistant" },
  { type: "modelContentBlockStartEvent", start: { type: "toolUseStart", name: nome, toolUseId: id } },
  { type: "modelContentBlockDeltaEvent", delta: { type: "toolUseInputDelta", input: JSON.stringify(entrada) } },
  { type: "modelContentBlockStopEvent" },
  { type: "modelMessageStopEvent", stopReason: "toolUse" },
];

let ip = 0;
async function chamar(corpo: unknown, cabecalhos: Record<string, string> = {}) {
  const r = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `ip-${ip}`, ...cabecalhos },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
  );
  const texto = await r.text();
  const eventos = r.headers.get("content-type")?.includes("ndjson")
    ? texto.trim().split("\n").map((l) => JSON.parse(l))
    : [];
  return { status: r.status, eventos, json: eventos.length ? null : JSON.parse(texto || "null") };
}

const falaDoComprador = (m: string) => ({ role: "user" as const, content: [{ text: m }] });

beforeEach(() => {
  ip++;
  estado.configurada = true;
  estado.modelo = new ModeloFalso([resposta("Oi!")]);
  reiniciarLimites();
  reiniciarStore();
});

afterEach(() => vi.useRealTimers());

describe("POST /api/chat", () => {
  it("recusa corpo inválido", async () => {
    expect((await chamar("não é json")).status).toBe(400);
    expect((await chamar({ imovelId: "mock-1", mensagem: "   " })).status).toBe(400);
    expect((await chamar({ imovelId: "mock-1", mensagem: "x".repeat(501) })).status).toBe(400);
    expect((await chamar({ imovelId: "mock-1", conversaId: "não-é-uuid", mensagem: "oi" })).status).toBe(400);
  });

  it("avisa quando a IA não está configurada, para a bolha usar o simulado", async () => {
    estado.configurada = false;
    const r = await chamar({ imovelId: "mock-1", mensagem: "oi" });
    expect(r.status).toBe(503);
    expect(r.json).toMatchObject({ erro: "ia_indisponivel" });
  });

  it("não atende imóvel inexistente ou vendido (RN-04)", async () => {
    expect((await chamar({ imovelId: "nao-existe", mensagem: "oi" })).status).toBe(404);
    expect((await chamar({ imovelId: "mock-2", mensagem: "oi" })).status).toBe(404);
  });

  it("responde em streaming, devolve o id da conversa e guarda o histórico", async () => {
    const r = await chamar({ imovelId: "mock-1", mensagem: "Quanto custa?" });
    expect(r.status).toBe(200);
    expect(r.eventos[0]).toMatchObject({ tipo: "inicio" });
    expect(r.eventos.filter((e) => e.tipo === "texto").map((e) => e.texto).join("")).toBe("Oi!");
    expect(r.eventos.at(-1)).toEqual({ tipo: "fim" });

    const salvo = await obterRepositorio().mensagensDaConversa(r.eventos[0].conversaId);
    expect(salvo.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("carrega o histórico da conversa na mensagem seguinte", async () => {
    const modelo = new ModeloFalso([resposta("Primeira"), resposta("Segunda")]);
    estado.modelo = modelo;
    const primeira = await chamar({ imovelId: "mock-1", mensagem: "um" });
    const conversaId = primeira.eventos[0].conversaId;
    await chamar({ imovelId: "mock-1", conversaId, mensagem: "dois" });

    expect(modelo.recebidas[0]).toHaveLength(1);
    expect(modelo.recebidas[1].map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("devolve os horários da ferramenta como sugestões", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-18T12:00:00-03:00"));
    estado.modelo = new ModeloFalso([chamarFerramenta("listar_horarios", { imovel_id: "mock-1" }), resposta("Qual horário prefere?")]);

    const r = await chamar({ imovelId: "mock-1", mensagem: "Quero visitar" });
    const fim = r.eventos.at(-1);
    expect(fim.tipo).toBe("fim");
    expect(fim.sugestoes[0]).toBe("sábado, 21/11, às 09:00");
    expect(fim.sugestoes.length).toBeLessThanOrEqual(8);
  });

  it("mostra os botões de consentimento quando o atendente pede o aval", async () => {
    estado.modelo = new ModeloFalso([resposta("Posso guardar seu nome e contato para passar ao corretor?")]);
    const r = await chamar({ imovelId: "mock-1", mensagem: "Maria, 47 99999-0000" });
    expect(r.eventos.at(-1)).toEqual({ tipo: "fim", pedeConsentimento: true, sugestoes: ["Autorizo", "Não autorizo"] });
  });

  it("encerra no limite de 30 mensagens do comprador sem chamar o modelo (RN-16)", async () => {
    const modelo = new ModeloFalso([resposta("não deveria falar")]);
    estado.modelo = modelo;
    const repo = obterRepositorio();
    const conversaId = await repo.criarConversa("mock-1");
    await repo.salvarMensagens(
      conversaId,
      Array.from({ length: 30 }, (_, i) => falaDoComprador(`mensagem ${i}`)),
    );

    const r = await chamar({ imovelId: "mock-1", conversaId, mensagem: "mais uma" });
    expect(r.status).toBe(200);
    expect(r.eventos.find((e) => e.tipo === "texto").texto).toContain("limite de mensagens");
    expect(r.eventos.at(-1)).toEqual({ tipo: "fim", encerrada: true });
    expect(modelo.recebidas).toHaveLength(0);
  });

  it("limita 20 mensagens por minuto por IP (RNF-10)", async () => {
    const codigos: number[] = [];
    for (let i = 0; i < 21; i++) codigos.push((await chamar({ imovelId: "nao-existe", mensagem: "oi" })).status);
    expect(codigos.slice(0, 20).every((c) => c === 404)).toBe(true);
    expect(codigos[20]).toBe(429);
  });

  it("limita 20 mensagens por minuto por conversa, mesmo com IPs diferentes (RNF-10)", async () => {
    const conversaId = await obterRepositorio().criarConversa("mock-1");
    const codigos: number[] = [];
    for (let i = 0; i < 21; i++) {
      ip++;
      codigos.push((await chamar({ imovelId: "nao-existe", conversaId, mensagem: "oi" })).status);
    }
    expect(codigos[20]).toBe(429);
  });

  it("não aceita conversa de outro imóvel nem inexistente", async () => {
    const doutro = await obterRepositorio().criarConversa("mock-2");
    expect((await chamar({ imovelId: "mock-1", conversaId: doutro, mensagem: "oi" })).status).toBe(404);
    expect((await chamar({ imovelId: "mock-1", conversaId: crypto.randomUUID(), mensagem: "oi" })).status).toBe(404);
  });

  it("falha do modelo vira mensagem de erro, sem derrubar nem registrar o texto do comprador", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    estado.modelo = new ModeloFalso([new Error("falha de rede com o texto: segredo-do-comprador")]);

    const r = await chamar({ imovelId: "mock-1", mensagem: "meu telefone é 47999990000" });
    expect(r.eventos.at(-1)).toMatchObject({ tipo: "erro" });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/47999990000|segredo-do-comprador/);
    log.mockRestore();
  });
});
