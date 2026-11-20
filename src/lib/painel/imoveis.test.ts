import { beforeEach, describe, expect, it } from "vitest";
import { reiniciarStore, store } from "@/mocks/painel";
import {
  adicionarFoto,
  atualizarImovel,
  buscarImovel,
  criarImovel,
  excluirImovel,
  listarImoveis,
  marcarVendido,
  moverFoto,
  publicarImovel,
  removerFotoDoImovel,
} from "./imoveis";
import { faltaParaPublicar, gerarSlug } from "./regras";
import { imovelSchema, type DadosImovel } from "./schema";

const DONO = "mock-corretor";
const OUTRO = "outro-corretor";

const dados: DadosImovel = {
  tipo: "apartamento",
  finalidade: "venda",
  titulo: "Apartamento de 2 quartos no Garcia",
  descricao: "Apartamento de exemplo com dois quartos e sacada.",
  bairro: "Garcia",
  cidade: "Blumenau",
  endereco: null,
  mostrarEndereco: false,
  latitude: null,
  longitude: null,
  preco: 350000,
  condominio: null,
  iptu: null,
  quartos: 2,
  suites: null,
  banheiros: 1,
  vagas: 1,
  areaM2: 60,
  aceitaFinanciamento: true,
  aceitaFgts: false,
  caracteristicas: [],
  infoAdicional: null,
};

beforeEach(() => reiniciarStore());

async function comFotos(n: number) {
  const imovel = await criarImovel(DONO, dados);
  for (let i = 0; i < n; i++) await adicionarFoto(DONO, imovel.id, `mock-unsplash:sala`);
  return imovel;
}

describe("slug (RN-03)", () => {
  it("junta tipo, quartos, bairro e cidade sem acento", () => {
    expect(gerarSlug({ tipo: "apartamento", quartos: 2, bairro: "Victor Konder", cidade: "Blumenau" }, new Set())).toBe(
      "apartamento-2-quartos-victor-konder-blumenau",
    );
    expect(gerarSlug({ tipo: "casa", quartos: 1, bairro: "Velha Grande", cidade: "São Paulo" }, new Set())).toBe(
      "casa-1-quarto-velha-grande-sao-paulo",
    );
    expect(gerarSlug({ tipo: "terreno", quartos: 0, bairro: "Garcia", cidade: "Blumenau" }, new Set())).toBe("terreno-garcia-blumenau");
  });

  it("acrescenta sufixo numérico quando já existe", async () => {
    const a = await criarImovel(DONO, dados);
    const b = await criarImovel(DONO, dados);
    const c = await criarImovel(DONO, dados);
    expect([a.slug, b.slug, c.slug]).toEqual([
      "apartamento-2-quartos-garcia-blumenau",
      "apartamento-2-quartos-garcia-blumenau-2",
      "apartamento-2-quartos-garcia-blumenau-3",
    ]);
  });

  it("muda enquanto é rascunho e fica fixo depois de publicado", async () => {
    const imovel = await comFotos(3);
    await atualizarImovel(DONO, imovel.id, { ...dados, bairro: "Itoupava" });
    expect((await buscarImovel(DONO, imovel.id))?.slug).toBe("apartamento-2-quartos-itoupava-blumenau");

    await publicarImovel(DONO, imovel.id);
    await atualizarImovel(DONO, imovel.id, { ...dados, bairro: "Velha" });
    expect((await buscarImovel(DONO, imovel.id))?.slug).toBe("apartamento-2-quartos-itoupava-blumenau");
  });
});

describe("publicar (RN-02)", () => {
  it("exige pelo menos 3 fotos", async () => {
    const imovel = await comFotos(2);
    expect(faltaParaPublicar(imovel)).toEqual(["pelo menos 3 fotos (hoje 2)"]);
    expect(await publicarImovel(DONO, imovel.id)).toMatchObject({ ok: false });
    expect((await buscarImovel(DONO, imovel.id))?.status).toBe("rascunho");
  });

  it("publica com 3 fotos e registra a data", async () => {
    const imovel = await comFotos(3);
    const r = await publicarImovel(DONO, imovel.id);
    expect(r).toMatchObject({ ok: true });
    const salvo = await buscarImovel(DONO, imovel.id);
    expect(salvo?.status).toBe("publicado");
    expect(salvo?.publicadoEm).not.toBeNull();
  });

  it("só marca como vendido o que está publicado", async () => {
    const imovel = await comFotos(3);
    expect(await marcarVendido(DONO, imovel.id)).toMatchObject({ ok: false });
    await publicarImovel(DONO, imovel.id);
    expect(await marcarVendido(DONO, imovel.id)).toMatchObject({ ok: true });
  });

  it("não deixa tirar fotos abaixo de 3 com o imóvel publicado", async () => {
    const imovel = await comFotos(3);
    await publicarImovel(DONO, imovel.id);
    const foto = (await buscarImovel(DONO, imovel.id))!.fotos[0];
    expect(await removerFotoDoImovel(DONO, imovel.id, foto.id)).toMatchObject({ ok: false });
  });
});

describe("dono do imóvel (RN-07)", () => {
  it("outro corretor não vê, não edita, não publica e não exclui", async () => {
    const imovel = await comFotos(3);
    expect(await buscarImovel(OUTRO, imovel.id)).toBeNull();
    expect(await listarImoveis(OUTRO)).toEqual([]);
    expect(await atualizarImovel(OUTRO, imovel.id, dados)).toMatchObject({ ok: false });
    expect(await publicarImovel(OUTRO, imovel.id)).toMatchObject({ ok: false });
    expect(await adicionarFoto(OUTRO, imovel.id, "x")).toMatchObject({ ok: false });
    expect(await excluirImovel(OUTRO, imovel.id)).toMatchObject({ ok: false });
    expect(await buscarImovel(DONO, imovel.id)).not.toBeNull();
  });
});

describe("fotos (RN-08)", () => {
  it("move a foto e a primeira é a capa", async () => {
    const imovel = await criarImovel(DONO, dados);
    for (const nome of ["a", "b", "c"]) await adicionarFoto(DONO, imovel.id, `mock-unsplash:${nome}`);
    const [a, , c] = (await buscarImovel(DONO, imovel.id))!.fotos;
    await moverFoto(DONO, imovel.id, c.id, -1);
    await moverFoto(DONO, imovel.id, c.id, -1);
    const ordem = (await buscarImovel(DONO, imovel.id))!.fotos.map((f) => f.fileId);
    expect(ordem).toEqual(["mock-unsplash:c", "mock-unsplash:a", "mock-unsplash:b"]);
    expect(a.fileId).toBe("mock-unsplash:a");
  });
});

describe("excluir (RN-25)", () => {
  it("remove o imóvel e libera o slug", async () => {
    const imovel = await comFotos(3);
    expect(await excluirImovel(DONO, imovel.id)).toMatchObject({ ok: true });
    expect(await buscarImovel(DONO, imovel.id)).toBeNull();
    expect(store().imoveis.some((i) => i.slug === imovel.slug)).toBe(false);
  });
});

describe("imovelSchema", () => {
  it("aceita um cadastro completo", () => {
    expect(imovelSchema.safeParse(dados).success).toBe(true);
  });

  it("rejeita preço zero, área negativa, número quebrado e título curto", () => {
    for (const ruim of [{ preco: 0 }, { areaM2: -5 }, { quartos: 1.5 }, { quartos: Number.NaN }, { titulo: "Casa" }, { tipo: "castelo" }]) {
      expect(imovelSchema.safeParse({ ...dados, ...ruim }).success).toBe(false);
    }
  });
});
