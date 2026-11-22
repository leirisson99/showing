import { describe, expect, it } from "vitest";
import { ehAdmin, gastoPorCorretor, gastoPorDia, porSemana, somarUso, type LinhaDeUso } from "./admin";

const preco = { AI_PRECO_ENTRADA: "1", AI_PRECO_SAIDA: "2" };
const linha = (o: Partial<LinhaDeUso>): LinhaDeUso => ({ tipo: "chat", imovelId: null, corretorId: null, entradaTokens: 1_000_000, saidaTokens: 0, criadoEm: new Date("2026-11-20T15:00:00Z"), ...o });

describe("admin", () => {
  it("ehAdmin lê ADMIN_EMAILS sem diferenciar maiúsculas e nega sem a variável", () => {
    const env = { ADMIN_EMAILS: " Ana@x.com, b@x.com " };
    expect(ehAdmin("ana@x.com", env)).toBe(true);
    expect(ehAdmin("c@x.com", env)).toBe(false);
    expect(ehAdmin("ana@x.com", {})).toBe(false);
    expect(ehAdmin(null, env)).toBe(false);
  });

  it("soma tokens e calcula o custo; sem preço o custo é null", () => {
    const g = somarUso([linha({}), linha({ entradaTokens: 0, saidaTokens: 500_000 })], preco);
    expect(g).toEqual({ chamadas: 2, entrada: 1_000_000, saida: 500_000, custo: 2 });
    expect(somarUso([linha({})], {}).custo).toBeNull();
  });

  it("gastoPorDia devolve todos os dias, inclusive os vazios, em horário de Brasília", () => {
    const agora = new Date("2026-11-22T12:00:00Z");
    const dias = gastoPorDia([linha({ criadoEm: new Date("2026-11-21T02:00:00Z") })], 3, agora, preco);
    expect(dias.map((d) => d.dia)).toEqual(["2026-11-20", "2026-11-21", "2026-11-22"]);
    // 02:00 UTC ainda é dia 20 em Brasília.
    expect(dias.map((d) => d.chamadas)).toEqual([1, 0, 0]);
  });

  it("gastoPorCorretor usa corretorId, depois o dono do imóvel, e deixa o resto sem dono", () => {
    const donos = new Map([["i1", "c2"]]);
    const m = gastoPorCorretor([linha({ corretorId: "c1" }), linha({ imovelId: "i1" }), linha({})], donos, preco);
    expect(m.get("c1")?.chamadas).toBe(1);
    expect(m.get("c2")?.chamadas).toBe(1);
    expect(m.get(null)?.chamadas).toBe(1);
  });

  it("porSemana agrupa pelas últimas semanas", () => {
    const agora = new Date("2026-11-22T12:00:00Z");
    const s = porSemana([new Date("2026-11-21T00:00:00Z"), new Date("2026-11-10T00:00:00Z"), new Date("2026-01-01T00:00:00Z")], 2, agora);
    expect(s.map((x) => x.total)).toEqual([1, 1]);
  });
});
