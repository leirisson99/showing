import { describe, expect, it } from "vitest";
import { LIMITE_MENSAGENS_COMPRADOR } from "@/lib/ai/limites";
import { conversaEncerrada } from "./limite";

const base = { encerradaNoServidor: false, mensagensDoComprador: 0, digitando: false, ultimoPapel: "assistente" as const };

describe("conversaEncerrada (RN-16)", () => {
  it("segue aberta até o limite", () => {
    expect(conversaEncerrada({ ...base, mensagensDoComprador: LIMITE_MENSAGENS_COMPRADOR - 1 })).toBe(false);
  });

  it("encerra com 30 mensagens do comprador depois da resposta do atendente", () => {
    expect(LIMITE_MENSAGENS_COMPRADOR).toBe(30);
    expect(conversaEncerrada({ ...base, mensagensDoComprador: 30 })).toBe(true);
  });

  it("espera a resposta à 30ª mensagem terminar", () => {
    expect(conversaEncerrada({ ...base, mensagensDoComprador: 30, digitando: true })).toBe(false);
    expect(conversaEncerrada({ ...base, mensagensDoComprador: 30, ultimoPapel: "usuario" })).toBe(false);
  });

  it("encerra de imediato quando o servidor avisa", () => {
    expect(conversaEncerrada({ ...base, encerradaNoServidor: true, digitando: true, ultimoPapel: "usuario" })).toBe(true);
  });
});
