import { describe, expect, it } from "vitest";
import { cadastroSchema } from "./auth-schema";

const valido = { nome: "Maria Souza", email: "  Maria@Exemplo.com.br ", aceite: "on" };

describe("cadastroSchema", () => {
  it("normaliza o e-mail e aceita o CRECI vazio", () => {
    const r = cadastroSchema.parse(valido);
    expect(r.email).toBe("maria@exemplo.com.br");
    expect(r.creci).toBeUndefined();
  });

  it("exige nome, e-mail válido e o aceite da privacidade", () => {
    expect(cadastroSchema.safeParse({ ...valido, nome: "Ma" }).success).toBe(false);
    expect(cadastroSchema.safeParse({ ...valido, email: "maria@exemplo.cm." }).success).toBe(false);
    expect(cadastroSchema.safeParse({ ...valido, aceite: undefined }).success).toBe(false);
  });
});
