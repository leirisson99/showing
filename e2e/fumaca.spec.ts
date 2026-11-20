import { expect, test } from "@playwright/test";
import { rotasComId, TODAS_AS_ROTAS } from "./rotas";

// Cada rota abre, sem erro de console e sem rolagem horizontal (checklist §6).
// Erros de rede de imagens externas (Unsplash) não contam: dependem da internet.
const RUIDO = /Failed to load resource|favicon|net::ERR/i;

async function conferir(page: import("@playwright/test").Page, caminho: string) {
  const erros: string[] = [];
  page.on("console", (m) => m.type() === "error" && !RUIDO.test(m.text()) && erros.push(m.text()));
  page.on("pageerror", (e) => erros.push(e.message));

  const resposta = await page.goto(caminho, { waitUntil: "networkidle" });
  expect(resposta?.status(), `status de ${caminho}`).toBeLessThan(400);

  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sobra, `rolagem horizontal em ${caminho}`).toBeLessThanOrEqual(1);
  expect(erros, `erros de console em ${caminho}`).toEqual([]);
}

test.describe("fumaça das rotas", () => {
  for (const { nome, caminho } of TODAS_AS_ROTAS) {
    test(nome, async ({ page }) => {
      await conferir(page, caminho);
    });
  }

  test("rotas com id (conversa e cliente)", async ({ page }) => {
    for (const { caminho } of await rotasComId(page)) await conferir(page, caminho);
  });
});
