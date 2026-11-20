import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { custoEstimado, limiteDiario } from "./uso";

describe("custo estimado", () => {
  it("calcula em dólares pelo preço por 1 milhão de tokens e devolve null sem preço", () => {
    const env = { AI_PRECO_ENTRADA: "0.30", AI_PRECO_SAIDA: "2.50" };
    expect(custoEstimado({ entrada: 1_000_000, saida: 100_000 }, env)).toBeCloseTo(0.3 + 0.25, 6);
    expect(custoEstimado({ entrada: 0, saida: 0 }, env)).toBe(0);
    expect(custoEstimado({ entrada: 10, saida: 10 }, {})).toBeNull();
    expect(custoEstimado({ entrada: 10, saida: 10 }, { AI_PRECO_ENTRADA: "", AI_PRECO_SAIDA: "" })).toBeNull();
    expect(custoEstimado({ entrada: 10, saida: 10 }, { AI_PRECO_ENTRADA: "abc", AI_PRECO_SAIDA: "1" })).toBeNull();
  });

  it("limite diário padrão de 300 e AI_LIMITE_DIARIO válido sobrescreve", () => {
    const antes = process.env.AI_LIMITE_DIARIO;
    delete process.env.AI_LIMITE_DIARIO;
    expect(limiteDiario()).toBe(300);
    process.env.AI_LIMITE_DIARIO = "50";
    expect(limiteDiario()).toBe(50);
    process.env.AI_LIMITE_DIARIO = "-1";
    expect(limiteDiario()).toBe(300);
    if (antes === undefined) delete process.env.AI_LIMITE_DIARIO;
    else process.env.AI_LIMITE_DIARIO = antes;
  });
});

describe.skipIf(!process.env.DATABASE_URL)("uso no Prisma", () => {
  let db: typeof import("@/lib/db").db;
  let uso: typeof import("./uso");
  const antes = process.env.USAR_MOCKS;
  const marca = `teste-${Date.now()}`;

  beforeAll(async () => {
    process.env.USAR_MOCKS = ""; // grava de verdade
    ({ db } = await import("@/lib/db"));
    uso = await import("./uso");
    process.env.AI_MODEL = marca;
  });
  afterAll(async () => {
    await db.usoIA.deleteMany({ where: { modelo: marca } });
    await db.$disconnect();
    process.env.USAR_MOCKS = antes;
  });

  it("grava só contagens e o limite diário bloqueia quando o total passa", async () => {
    await uso.registrarUso("chat", { entrada: 1200, saida: 80 }, "imovel-x");
    const linha = await db.usoIA.findFirstOrThrow({ where: { modelo: marca } });
    expect(linha).toMatchObject({ tipo: "chat", entradaTokens: 1200, saidaTokens: 80, imovelId: "imovel-x" });

    const agora = new Date();
    process.env.AI_LIMITE_DIARIO = String((await db.usoIA.count({ where: { tipo: "chat", criadoEm: { gte: new Date(agora.getTime() - 86_400_000) } } })) + 1);
    expect(await uso.limiteDiarioAtingido(agora)).toBe(false);
    await uso.registrarUso("chat", { entrada: 1, saida: 1 });
    expect(await uso.limiteDiarioAtingido(agora)).toBe(true);
    // Passadas 24 horas, o contador zera.
    expect(await uso.limiteDiarioAtingido(new Date(agora.getTime() + 25 * 3_600_000))).toBe(false);
    delete process.env.AI_LIMITE_DIARIO;
  });
});
