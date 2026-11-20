import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Rota de upload com os mocks ligados (USAR_MOCKS=1): sem sessão real, banco ou Appwrite.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

async function chamar(campos: Record<string, string | File>) {
  const { POST } = await import("./route");
  const corpo = new FormData();
  for (const [k, v] of Object.entries(campos)) corpo.set(k, v);
  return POST(new Request("http://localhost/api/upload", { method: "POST", body: corpo }));
}

const foto = (bytes: Uint8Array = PNG, tipo = "image/png") => new File([bytes as BlobPart], "foto.png", { type: tipo });

describe("POST /api/upload", () => {
  beforeEach(async () => {
    vi.stubEnv("USAR_MOCKS", "1");
    (await import("@/mocks/painel")).reiniciarStore();
  });

  afterEach(async () => {
    const { store } = await import("@/mocks/painel");
    const { apagarFoto } = await import("@/lib/fotos");
    for (const f of store().imoveis.flatMap((i) => i.fotos)) await apagarFoto(f.fileId);
    vi.unstubAllEnvs();
  });

  it("guarda a foto e a anexa ao imóvel do corretor", async () => {
    const r = await chamar({ imovelId: "mock-1", arquivo: foto() });
    expect(r.status).toBe(200);
    const { foto: criada } = await r.json();
    expect(criada.src).toMatch(/^\/mock-uploads\/.+\.png$/);
    const { store } = await import("@/mocks/painel");
    expect(store().imoveis.find((i) => i.id === "mock-1")?.fotos).toHaveLength(7);
  });

  it("recusa arquivo que não é imagem mesmo com tipo de imagem (RNF-09)", async () => {
    const r = await chamar({ imovelId: "mock-1", arquivo: foto(new TextEncoder().encode("não sou uma imagem")) });
    expect(r.status).toBe(400);
  });

  it("recusa tipo fora de jpg, png e webp", async () => {
    expect((await chamar({ imovelId: "mock-1", arquivo: foto(PNG, "application/pdf") })).status).toBe(400);
  });

  it("recusa arquivo maior que 10 MB", async () => {
    const grande = new Uint8Array(10 * 1024 * 1024 + 1);
    grande.set(PNG);
    expect((await chamar({ imovelId: "mock-1", arquivo: foto(grande) })).status).toBe(400);
  });

  it("devolve 404 para imóvel que não existe ou não é do corretor", async () => {
    expect((await chamar({ imovelId: "nao-existe", arquivo: foto() })).status).toBe(404);
  });

  it("exige sessão fora dos mocks", async () => {
    vi.stubEnv("USAR_MOCKS", "");
    expect((await chamar({ imovelId: "mock-1", arquivo: foto() })).status).toBe(401);
  });

  it("recusa pedido sem arquivo", async () => {
    expect((await chamar({ imovelId: "mock-1" })).status).toBe(400);
  });
});
