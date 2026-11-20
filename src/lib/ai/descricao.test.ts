import { describe, expect, it } from "vitest";
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
