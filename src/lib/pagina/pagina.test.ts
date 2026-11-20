import { describe, expect, it } from "vitest";
import { alertasDaFicha, roteiroPadrao } from "./padrao";
import { problemasDeVoz } from "./palavras";
import { valorDoCampo, type EntradaRoteiro } from "./entrada";
import type { Roteiro } from "./roteiro";
import { validarRoteiro } from "./validador";

const fotos = (n: number, legendas = false) => Array.from({ length: n }, (_, k) => ({ id: `f${k + 1}`, ordem: k, legenda: legendas ? `Ambiente ${k + 1}` : null }));

function ficha(n = 9, extra: Partial<EntradaRoteiro["imovel"]> = {}): EntradaRoteiro {
  return {
    imovel: {
      tipo: "casa", finalidade: "venda", bairro: "Itoupava Norte", cidade: "Blumenau", endereco: "Rua Dr. Pedro Zimmermann 1234", mostrarEndereco: false,
      preco: 650000, condominio: null, iptu: 1800, quartos: 3, suites: 1, banheiros: 2, vagas: 2, areaM2: 180, aceitaFinanciamento: true, aceitaFgts: false,
      caracteristicas: ["Quintal com churrasqueira", "Sala integrada à cozinha"], infoAdicional: null,
      infoBairro: { escolas: ["Escola de exemplo A"], mercados: ["Mercado de exemplo"], saude: [], distanciaCentro: "10 minutos" },
      ...extra,
    },
    fotos: fotos(n, true),
  };
}

const ok = (r: ReturnType<typeof validarRoteiro>) => (r.ok ? [] : r.erros);

describe("roteiro padrão", () => {
  it("com 9 fotos e 3 quartos escolhe o familia e passa pelo validador", () => {
    const e = ficha(9);
    const r = roteiroPadrao(e);
    expect(r.template).toBe("familia");
    expect(r.capitulos.map((c) => c.tipo)).toEqual(["hero_imagem", "numeros", "ambientes_fixo", "galeria_horizontal", "bairro", "duvidas", "cta_visita"]);
    expect(ok(validarRoteiro(r, e))).toEqual([]);
  });

  it("com poucas fotos cai no essencial, com todas as fotos na grade", () => {
    for (const n of [3, 5, 7]) {
      const e = ficha(n);
      const r = roteiroPadrao(e);
      expect(r.template).toBe("essencial");
      expect(r.capitulos.some((c) => c.tipo === "ambientes_fixo")).toBe(false);
      expect(ok(validarRoteiro(r, e))).toEqual([]);
    }
  });

  it("campo vazio não vira texto: sem condomínio, IPTU nem FGTS não há pergunta sobre eles", () => {
    const e = ficha(9, { iptu: null, aceitaFgts: null });
    const r = roteiroPadrao(e);
    const duvidas = r.capitulos.find((c) => c.tipo === "duvidas")!;
    const perguntas = duvidas.tipo === "duvidas" ? duvidas.perguntas.map((p) => p.pergunta) : [];
    expect(perguntas.join(" ")).not.toMatch(/IPTU|FGTS|condom/i);
    expect(perguntas.at(-1)).toBe("Quero agendar uma visita");
    expect(alertasDaFicha(e).join(" ")).toMatch(/Condomínio não preenchido/);
    expect(ok(validarRoteiro(r, e))).toEqual([]);
  });

  it("sem informações do bairro o capítulo do bairro só cita bairro e cidade", () => {
    const e = ficha(9, { infoBairro: null });
    const r = roteiroPadrao(e);
    const b = r.capitulos.find((c) => c.tipo === "bairro")!;
    expect(b.tipo === "bairro" && b.titulo.fontes.map((f) => f.campo)).toEqual(["imovel.bairro", "imovel.cidade"]);
    expect(ok(validarRoteiro(r, e))).toEqual([]);
  });

  it("terreno não ganha quartos nem capítulo de números sem 3 números", () => {
    const e = ficha(4, { tipo: "terreno", quartos: 0, suites: null, banheiros: 0, vagas: 0 });
    const r = roteiroPadrao(e);
    expect(r.capitulos.some((c) => c.tipo === "numeros")).toBe(false);
    expect(JSON.stringify(r)).not.toMatch(/quarto/i);
    expect(ok(validarRoteiro(r, e))).toEqual([]);
  });
});

describe("validador do roteiro", () => {
  const e = ficha(9);
  const base = () => structuredClone(roteiroPadrao(e)) as Roteiro;
  const mudar = (f: (r: Roteiro) => void) => {
    const r = base();
    f(r);
    return ok(validarRoteiro(r, e));
  };

  it("recusa número que não está na ficha e superlativo", () => {
    expect(mudar((r) => { const h = r.capitulos[0]; if (h.tipo === "hero_imagem") h.titulo.texto = "Casa de 12 quartos"; }).join(" ")).toMatch(/número 12 não está na ficha/);
    expect(mudar((r) => { const h = r.capitulos[0]; if (h.tipo === "hero_imagem") h.titulo.texto = "A melhor casa do bairro"; }).join(" ")).toMatch(/superlativo/);
  });

  it("recusa fonte que não existe ou campo vazio", () => {
    const erros = mudar((r) => {
      const h = r.capitulos[0];
      if (h.tipo === "hero_imagem") h.titulo.fontes = [{ campo: "imovel.condominio" }, { campo: "imovel.piscina" }];
    });
    expect(erros.join(" ")).toMatch(/imovel\.condominio.*não existe ou não está preenchida/);
    expect(erros.join(" ")).toMatch(/imovel\.piscina/);
  });

  it("recusa endereço quando o corretor não liberou (RN-05)", () => {
    expect(mudar((r) => { const h = r.capitulos[0]; if (h.tipo === "hero_imagem") h.titulo.texto = "Casa na Zimmermann"; }).join(" ")).toMatch(/endereço/);
  });

  it("confere a ordem: hero primeiro, duvidas e cta por último", () => {
    expect(mudar((r) => { r.capitulos.reverse(); }).join(" ")).toMatch(/primeiro capítulo|dois últimos/);
    expect(mudar((r) => { const n = r.capitulos.length; [r.capitulos[n - 2], r.capitulos[n - 1]] = [r.capitulos[n - 1], r.capitulos[n - 2]]; }).join(" ")).toMatch(/dois últimos/);
  });

  it("deixa trocar a ordem do meio e tirar capítulo opcional", () => {
    expect(mudar((r) => { [r.capitulos[1], r.capitulos[2]] = [r.capitulos[2], r.capitulos[1]]; })).toEqual([]);
    expect(mudar((r) => { r.capitulos = r.capitulos.filter((c) => c.tipo !== "numeros"); })).toEqual([]);
  });

  it("não aceita capítulo de outro template nem tipo repetido", () => {
    expect(mudar((r) => { r.template = "essencial"; }).join(" ")).toMatch(/não tem o capítulo/);
  });

  it("não deixa a mesma foto em dois capítulos, só a capa", () => {
    const erros = mudar((r) => {
      const amb = r.capitulos.find((c) => c.tipo === "ambientes_fixo");
      const gal = r.capitulos.find((c) => c.tipo === "galeria_horizontal");
      if (amb?.tipo === "ambientes_fixo" && gal?.tipo === "galeria_horizontal") gal.fotos[0] = amb.quadros[0].foto;
    });
    expect(erros.join(" ")).toMatch(/aparece em mais de um capítulo/);
    // A capa repete na galeria do roteiro padrão e isso é permitido.
    const r = base();
    const gal = r.capitulos.find((c) => c.tipo === "galeria_horizontal");
    expect(gal?.tipo === "galeria_horizontal" && gal.fotos.includes("f1")).toBe(true);
    expect(ok(validarRoteiro(r, e))).toEqual([]);
  });

  it("foto que não existe e familia com poucas fotos", () => {
    expect(mudar((r) => { const h = r.capitulos[0]; if (h.tipo === "hero_imagem") h.foto = "nao-existe"; }).join(" ")).toMatch(/não existe neste imóvel/);
    const pequeno = ficha(6);
    const r = roteiroPadrao(pequeno);
    r.template = "familia";
    expect(ok(validarRoteiro(r, pequeno)).join(" ")).toMatch(/o template é essencial/);
  });

  it("só aceita perguntas do catálogo, com campo preenchido, rótulo NN / Tema e a visita por último", () => {
    const erros = mudar((r) => {
      const d = r.capitulos.find((c) => c.tipo === "duvidas");
      if (d?.tipo === "duvidas") d.perguntas = [{ rotulo: "1 - Piscina", pergunta: "Tem piscina?" }, { rotulo: "02 / Custos", pergunta: "Quanto é o condomínio?" }, { rotulo: "03 / Financiamento", pergunta: "Aceita financiamento?" }];
    });
    expect(erros.join(" ")).toMatch(/não é uma pergunta que o atendente responda/);
    expect(erros.join(" ")).toMatch(/depende de um campo que não está preenchido/);
    expect(erros.join(" ")).toMatch(/formato NN \/ Tema/);
    expect(erros.join(" ")).toMatch(/última pergunta é sempre/);
  });

  it("limita título a 9 palavras, SEO a 60 e 155 caracteres, e recusa JSON fora do schema", () => {
    expect(mudar((r) => { const h = r.capitulos[0]; if (h.tipo === "hero_imagem") h.titulo.texto = "uma duas tres quatro cinco seis sete oito nove dez"; }).join(" ")).toMatch(/máximo é 9/);
    const r = base();
    r.seo.title = "x".repeat(61);
    expect(validarRoteiro(r, e).ok).toBe(false);
    expect(validarRoteiro({ versao: 1 }, e).ok).toBe(false);
    expect(validarRoteiro("texto", e).ok).toBe(false);
  });

  it("texto editado pelo corretor dispensa fonte e número, mas segue as regras de voz e de endereço", () => {
    const r = base();
    const h = r.capitulos[0];
    if (h.tipo === "hero_imagem") h.titulo = { texto: "Casa de 3 quartos com piscina", fontes: [{ campo: "imovel.piscina" }] };
    expect(validarRoteiro(r, e, { editado: true }).ok).toBe(true);
    if (h.tipo === "hero_imagem") h.titulo.texto = "Casa imperdível!!";
    expect(ok(validarRoteiro(r, e, { editado: true })).join(" ")).toMatch(/superlativo|exclamação/);
  });
});

describe("regras de voz", () => {
  it("pega superlativo, urgência, desconto, emoji, exclamação e caixa alta", () => {
    for (const t of ["A melhor casa", "Oportunidade única", "Últimas unidades", "Corre que acaba", "Aceita desconto", "Casa linda 🏡", "Venha ver!!", "CASA GRANDE E BONITA", "Ideal para casal sem filhos"]) {
      expect(problemasDeVoz(t).length, t).toBeGreaterThan(0);
    }
  });
  it("deixa passar texto concreto e siglas", () => {
    for (const t of ["Três quartos, um deles suíte.", "Aceita financiamento e FGTS.", "Quintal com churrasqueira."]) expect(problemasDeVoz(t), t).toEqual([]);
  });
});

describe("valorDoCampo", () => {
  const e = ficha(4);
  it("resolve campos, alias de área, listas e fotos; vazio vira undefined", () => {
    expect(valorDoCampo(e, "imovel.quartos")).toBe(3);
    expect(valorDoCampo(e, "imovel.area")).toBe(180);
    expect(valorDoCampo(e, "imovel.caracteristicas[1]")).toBe("Sala integrada à cozinha");
    expect(valorDoCampo(e, "imovel.caracteristicas[5]")).toBeUndefined();
    expect(valorDoCampo(e, "imovel.infoBairro.escolas")).toEqual(["Escola de exemplo A"]);
    expect(valorDoCampo(e, "imovel.infoBairro.saude")).toBeUndefined();
    expect(valorDoCampo(e, "imovel.condominio")).toBeUndefined();
    expect(valorDoCampo(e, "foto:f2")).toBe(true);
    expect(valorDoCampo(e, "foto:f99")).toBeUndefined();
    expect(valorDoCampo(e, "sistema")).toBe(true);
  });
});
