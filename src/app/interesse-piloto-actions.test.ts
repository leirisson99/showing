import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { reiniciarLimites } from "@/lib/rate-limit";

// O cabeçalho de IP vem do Next; aqui, de um valor controlado pelo teste.
const ip = vi.hoisted(() => ({ atual: "ip-1" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": ip.atual }) }));

import { registrarInteresseAction } from "./interesse-piloto-actions";

const form = (email: string) => {
  const f = new FormData();
  f.set("email", email);
  return f;
};

describe("registrarInteresseAction", () => {
  beforeEach(() => {
    reiniciarLimites();
    ip.atual = `ip-${Math.random()}`;
  });

  it("recusa e-mail inválido com a mensagem do design", async () => {
    expect(await registrarInteresseAction({}, form("nome@exemplo"))).toEqual({ erro: "Digite um e-mail válido, como nome@exemplo.com.br." });
    expect(await registrarInteresseAction({}, form(""))).toMatchObject({ erro: expect.any(String) });
  });

  it("em desenvolvimento com mocks aceita sem gravar", async () => {
    expect(await registrarInteresseAction({}, form("alguem@exemplo.com.br"))).toEqual({ ok: true });
  });

  it("depois de 5 pedidos do mesmo IP na hora, responde igual sem revelar o limite", async () => {
    for (let i = 0; i < 7; i++) expect(await registrarInteresseAction({}, form(`a${i}@exemplo.com.br`))).toEqual({ ok: true });
  });
});

describe.skipIf(!process.env.DATABASE_URL)("interesse no Prisma", () => {
  const email = `piloto-${Date.now()}@teste.local`;
  afterAll(async () => {
    const { db } = await import("@/lib/db");
    await db.interessePiloto.deleteMany({ where: { email } });
    await db.$disconnect();
  });

  it("guarda o e-mail em minúsculas uma vez só, mesmo se enviado de novo", async () => {
    const antes = process.env.USAR_MOCKS;
    process.env.USAR_MOCKS = "";
    reiniciarLimites();
    ip.atual = `ip-${Math.random()}`;
    try {
      const { db } = await import("@/lib/db");
      expect(await registrarInteresseAction({}, form(email.toUpperCase()))).toEqual({ ok: true });
      expect(await registrarInteresseAction({}, form(email))).toEqual({ ok: true });
      expect(await db.interessePiloto.count({ where: { email } })).toBe(1);
    } finally {
      process.env.USAR_MOCKS = antes;
    }
  });
});
