import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DadosImovel } from "./schema";

// Integração com o Postgres local (pnpm env:check). Pula se não houver DATABASE_URL.
// Cria o próprio corretor e apaga tudo no fim.

const temBanco = Boolean(process.env.DATABASE_URL);

const dados: DadosImovel = {
  tipo: "casa", finalidade: "venda", titulo: "Casa de teste de integração", descricao: "Descrição de teste com mais de vinte caracteres.",
  bairro: "Itoupava Teste", cidade: "Blumenau", endereco: null, mostrarEndereco: false, latitude: -26.9, longitude: -49.07, preco: 410000.5, condominio: null, iptu: null,
  quartos: 3, suites: null, banheiros: 2, vagas: 1, areaM2: 120.5, aceitaFinanciamento: true, aceitaFgts: false, caracteristicas: ["Pátio"], infoAdicional: null,
};

describe.skipIf(!temBanco)("imóveis no Prisma", () => {
  let imoveis: typeof import("./imoveis-db");
  let perfil: typeof import("./perfil-db");
  let db: typeof import("@/lib/db").db;
  const sufixo = Date.now().toString(36);
  let dono = "";
  let outro = "";

  beforeAll(async () => {
    ({ db } = await import("@/lib/db"));
    imoveis = await import("./imoveis-db");
    perfil = await import("./perfil-db");
    dono = (await db.user.create({ data: { email: `dono-${sufixo}@teste.local`, name: "Dono", creci: "CRECI-SC 1" } })).id;
    outro = (await db.user.create({ data: { email: `outro-${sufixo}@teste.local`, name: "Outro", creci: "CRECI-SC 2" } })).id;
  });

  afterAll(async () => {
    await db.imovel.deleteMany({ where: { corretorId: { in: [dono, outro] } } });
    await db.user.deleteMany({ where: { id: { in: [dono, outro] } } });
    await db.$disconnect();
  });

  it("cria rascunho com slug pelo RN-03 e sufixo quando repete", async () => {
    const a = await imoveis.criarImovel(dono, dados);
    const b = await imoveis.criarImovel(dono, dados);
    expect(a.status).toBe("rascunho");
    expect(a.slug).toBe("casa-3-quartos-itoupava-teste-blumenau");
    expect(b.slug).toBe("casa-3-quartos-itoupava-teste-blumenau-2");
    expect(a.preco).toBe(410000.5);
    expect(a.areaM2).toBe(120.5);
    expect(a.latitude).toBe(-26.9);
  });

  it("só o dono enxerga e altera (RN-07)", async () => {
    const i = (await imoveis.listarImoveis(dono))[0];
    expect(await imoveis.buscarImovel(outro, i.id)).toBeNull();
    expect(await imoveis.listarImoveis(outro)).toHaveLength(0);
    expect((await imoveis.atualizarImovel(outro, i.id, dados)).ok).toBe(false);
    expect((await imoveis.excluirImovel(outro, i.id)).ok).toBe(false);
  });

  it("publica só com 3 fotos e perfil completo, e o slug fica fixo depois (RN-02, RN-03)", async () => {
    const i = (await imoveis.criarImovel(dono, { ...dados, bairro: "Garcia Teste" }));
    const sem = await imoveis.publicarImovel(dono, i.id);
    expect(sem.ok).toBe(false);

    for (const f of ["a", "b", "c"]) await imoveis.adicionarFoto(dono, i.id, `mock-unsplash:${f}-${sufixo}`);
    const r = await imoveis.publicarImovel(dono, i.id);
    expect(r.ok).toBe(true);

    const editado = await imoveis.atualizarImovel(dono, i.id, { ...dados, bairro: "Outro Bairro" });
    expect(editado.ok && editado.imovel.slug).toBe(i.slug);

    const publico = await imoveis.buscarPublicoPorSlug(i.slug);
    expect(publico?.status).toBe("publicado");
    expect(await imoveis.listarSlugs(true)).toContain(i.slug);

    await imoveis.despublicarImovel(dono, i.id);
    expect(await imoveis.buscarPublicoPorSlug(i.slug)).toBeNull();
  });

  it("recusa publicar sem nome e CRECI no perfil", async () => {
    await db.user.update({ where: { id: outro }, data: { creci: null } });
    const i = await imoveis.criarImovel(outro, dados);
    for (const f of ["a", "b", "c"]) await imoveis.adicionarFoto(outro, i.id, `mock-unsplash:${f}-${sufixo}-o`);
    const r = await imoveis.publicarImovel(outro, i.id);
    expect(!r.ok && r.erro).toMatch(/perfil/i);
  });

  it("move, legenda e remove fotos mantendo a ordem (RN-08)", async () => {
    const i = await imoveis.criarImovel(dono, { ...dados, bairro: "Fotos Teste" });
    for (const f of ["a", "b", "c"]) await imoveis.adicionarFoto(dono, i.id, `mock-unsplash:${f}-${sufixo}-f`);
    let atual = (await imoveis.buscarImovel(dono, i.id))!;
    expect(atual.fotos.map((f) => f.ordem)).toEqual([0, 1, 2]);

    const ultima = atual.fotos[2];
    const m = await imoveis.moverFoto(dono, i.id, ultima.id, -1);
    atual = m.ok ? m.imovel : atual;
    expect(atual.fotos[1].id).toBe(ultima.id);

    expect((await imoveis.legendarFoto(dono, i.id, ultima.id, "  Sala  ")).ok).toBe(true);
    expect((await imoveis.buscarImovel(dono, i.id))!.fotos.find((f) => f.id === ultima.id)?.legenda).toBe("Sala");

    const r = await imoveis.removerFotoDoImovel(dono, i.id, atual.fotos[0].id);
    expect(r.ok && r.imovel.fotos.map((f) => f.ordem)).toEqual([0, 1]);
  });

  it("marca vendido só se publicado e exclui em cascata (RN-25)", async () => {
    const i = await imoveis.criarImovel(dono, { ...dados, bairro: "Venda Teste" });
    expect((await imoveis.marcarVendido(dono, i.id)).ok).toBe(false);
    for (const f of ["a", "b", "c"]) await imoveis.adicionarFoto(dono, i.id, `mock-unsplash:${f}-${sufixo}-v`);
    await imoveis.publicarImovel(dono, i.id);
    const v = await imoveis.marcarVendido(dono, i.id);
    expect(v.ok && v.imovel.status).toBe("vendido");
    expect(await imoveis.listarSlugs(true)).not.toContain(i.slug);
    expect(await imoveis.listarSlugs(false)).toContain(i.slug);

    expect((await imoveis.excluirImovel(dono, i.id)).ok).toBe(true);
    expect(await db.foto.count({ where: { imovelId: i.id } })).toBe(0);
  });

  it("salva o perfil e guarda os horários ordenados", async () => {
    const r = await perfil.salvarPerfil(dono, {
      nome: "Ana Teste", creci: "CRECI-SC 9", whatsapp: "(47) 99999-0000", horariosVisita: { sab: ["10:00", "09:00"] }, duracaoVisitaMin: 45,
    });
    expect(r.ok && r.perfil.horariosVisita).toEqual({ sab: ["09:00", "10:00"] });
    const lido = await perfil.buscarPerfil(dono);
    expect(lido).toMatchObject({ nome: "Ana Teste", whatsapp: "47999990000", duracaoVisitaMin: 45 });
    expect(await perfil.buscarPerfil("nao-existe")).toBeNull();
  });
});
