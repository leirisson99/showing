import { beforeEach, describe, expect, it } from "vitest";
import { calcularHorariosLivres } from "@/lib/ai/horarios";
import { perfis, reiniciarPerfis } from "@/mocks/corretor";
import { reiniciarAtendimentoMock, repositorioMockGlobal } from "@/mocks/atendimento";
import { reiniciarStore } from "@/mocks/painel";
import { adicionarFoto, criarImovel, publicarImovel } from "./imoveis";
import { buscarPerfil, perfilCompleto, salvarPerfil } from "./perfil";
import { perfilSchema, type DadosPerfil } from "./perfil-schema";
import { buscarImovelPublico } from "@/lib/imoveis";
import type { DadosImovel } from "./schema";

const DONO = "mock-corretor";

const dados: DadosPerfil = {
  nome: "Ana Souza",
  creci: "CRECI-SC 12345",
  whatsapp: "(47) 99999-0000",
  horariosVisita: { sab: ["10:00", "09:00"], seg: [] },
  duracaoVisitaMin: 45,
};

const imovel: DadosImovel = {
  tipo: "apartamento", finalidade: "venda", titulo: "Apartamento de teste", descricao: "Descrição de teste com mais de vinte caracteres.",
  bairro: "Garcia", cidade: "Blumenau", endereco: null, mostrarEndereco: false, latitude: null, longitude: null, preco: 300000, condominio: null, iptu: null,
  quartos: 2, suites: null, banheiros: 1, vagas: 1, areaM2: 60, aceitaFinanciamento: true, aceitaFgts: false, caracteristicas: [], infoAdicional: null,
};

beforeEach(() => {
  reiniciarPerfis();
  reiniciarStore();
  reiniciarAtendimentoMock();
});

describe("perfilSchema", () => {
  it("aceita um perfil completo e um WhatsApp vazio", () => {
    expect(perfilSchema.safeParse(dados).success).toBe(true);
    expect(perfilSchema.safeParse({ ...dados, whatsapp: "" }).success).toBe(true);
  });

  it("recusa nome e CRECI vazios, WhatsApp curto, hora inválida, hora repetida e duração fora da lista", () => {
    for (const ruim of [
      { nome: " " },
      { creci: "" },
      { whatsapp: "123" },
      { horariosVisita: { sab: ["25:00"] } },
      { horariosVisita: { sab: ["9:00"] } },
      { horariosVisita: { sab: ["09:00", "09:00"] } },
      { horariosVisita: { sab: Array.from({ length: 13 }, (_, i) => `${String(8 + (i % 12)).padStart(2, "0")}:${i < 12 ? "00" : "30"}`) } },
      { duracaoVisitaMin: 50 },
    ]) {
      expect(perfilSchema.safeParse({ ...dados, ...ruim }).success).toBe(false);
    }
  });
});

describe("salvarPerfil", () => {
  it("grava os dados, ordena os horários e deixa só os dígitos do WhatsApp", async () => {
    expect(await salvarPerfil(DONO, dados)).toMatchObject({ ok: true });
    const p = (await buscarPerfil(DONO))!;
    expect(p).toMatchObject({ nome: "Ana Souza", whatsapp: "47999990000", duracaoVisitaMin: 45 });
    expect(p.horariosVisita).toEqual({ sab: ["09:00", "10:00"] });
  });

  it("só mexe no próprio perfil (RN-07)", async () => {
    expect(await salvarPerfil("outro-corretor", dados)).toMatchObject({ ok: false });
    expect((await buscarPerfil(DONO))?.nome).toBe("Corretor de Exemplo");
  });
});

describe("perfil e página pública", () => {
  it("nome, CRECI e WhatsApp do perfil chegam à página, sem e-mail nem id", async () => {
    await salvarPerfil(DONO, dados);
    const publico = (await buscarImovelPublico("apartamento-2-quartos-victor-konder-blumenau"))!;
    expect(publico.corretor).toEqual({ nome: "Ana Souza", creci: "CRECI-SC 12345", whatsapp: "47999990000", fotoSrc: null });
    expect(JSON.stringify(publico)).not.toContain(perfis().get(DONO)!.email);
  });
});

describe("publicar exige perfil completo", () => {
  async function imovelPronto() {
    const i = await criarImovel(DONO, imovel);
    for (let n = 0; n < 3; n++) await adicionarFoto(DONO, i.id, "mock-unsplash:x");
    return i;
  }

  it("bloqueia sem CRECI e libera depois de completar", async () => {
    const i = await imovelPronto();
    perfis().set(DONO, { ...perfis().get(DONO)!, creci: null });
    expect(perfilCompleto(await buscarPerfil(DONO))).toBe(false);
    expect(await publicarImovel(DONO, i.id)).toMatchObject({ ok: false, erro: expect.stringContaining("perfil") });

    await salvarPerfil(DONO, dados);
    expect(await publicarImovel(DONO, i.id)).toMatchObject({ ok: true });
  });
});

describe("perfil e atendente", () => {
  it("os horários e a duração do perfil são os que o atendente oferece (RN-17)", async () => {
    await salvarPerfil(DONO, { ...dados, horariosVisita: { sab: ["15:00"] }, duracaoVisitaMin: 90 });
    const { horariosVisita, duracaoMin } = await repositorioMockGlobal().horariosDoCorretor("mock-1");
    expect(horariosVisita).toEqual({ sab: ["15:00"] });
    expect(duracaoMin).toBe(90);

    const livres = calcularHorariosLivres({ horariosVisita, duracaoMin, ocupados: [], agora: new Date("2026-11-18T12:00:00-03:00") });
    expect(livres.map((h) => h.iso)).toEqual(["2026-11-21T15:00:00-03:00", "2026-11-28T15:00:00-03:00"]);
  });

  it("sem horários cadastrados o atendente não oferece nenhum", async () => {
    await salvarPerfil(DONO, { ...dados, horariosVisita: {} });
    const { horariosVisita, duracaoMin } = await repositorioMockGlobal().horariosDoCorretor("mock-1");
    expect(calcularHorariosLivres({ horariosVisita, duracaoMin, ocupados: [], agora: new Date() })).toEqual([]);
  });
});
