import { describe, expect, it } from "vitest";
import { linkDeConfirmacao, urlDoCallback } from "./link-acesso";

const SITE = "https://showing.exemplo.com.br";
const DO_AUTHJS = "http://0.0.0.0:80/api/auth/callback/email?callbackUrl=http%3A%2F%2F0.0.0.0%3A80%2Fpainel&token=abc123&email=maria%40exemplo.com.br";

describe("link de acesso", () => {
  it("o e-mail aponta para a tela de confirmação, no domínio público, sem consumir o token", () => {
    const link = new URL(linkDeConfirmacao(DO_AUTHJS, SITE));
    expect(link.origin).toBe(SITE);
    expect(link.pathname).toBe("/login/confirmar");
    expect(link.searchParams.get("token")).toBe("abc123");
    expect(link.searchParams.get("email")).toBe("maria@exemplo.com.br");
    expect(link.searchParams.get("callbackUrl")).toBe("/painel");
  });

  it("o link de verdade usa o domínio público e o caminho do painel", () => {
    const url = new URL(urlDoCallback({ token: "abc123", email: "maria@exemplo.com.br", callbackUrl: "/painel" }, SITE));
    expect(url.origin + url.pathname).toBe(`${SITE}/api/auth/callback/email`);
    expect(url.searchParams.get("callbackUrl")).toBe(`${SITE}/painel`);
    expect(url.searchParams.get("token")).toBe("abc123");
  });

  it("nunca redireciona para outro domínio", () => {
    for (const ruim of ["https://malicioso.com/x", "//malicioso.com", "javascript:alert(1)"]) {
      const url = new URL(urlDoCallback({ token: "t", email: "a@b.com", callbackUrl: ruim }, SITE));
      expect(new URL(url.searchParams.get("callbackUrl")!).origin).toBe(SITE);
    }
  });
});
