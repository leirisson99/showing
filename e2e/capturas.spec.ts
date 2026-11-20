import { test } from "@playwright/test";
import { rotasComId, TODAS_AS_ROTAS } from "./rotas";

// Capturas de tela de todas as rotas nos dois tamanhos: e2e/capturas/<rota>-<projeto>.png.
// Servem para olhar o resultado (contra layouts/ e docs/pages.md), não para comparar pixels.
test.describe("capturas", () => {
  for (const { nome, caminho } of TODAS_AS_ROTAS) {
    test(nome, async ({ page }, info) => {
      await page.goto(caminho, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500); // animações de entrada do hero
      await page.screenshot({ path: `e2e/capturas/${nome}-${info.project.name}.png`, fullPage: true });
    });
  }

  test("rotas com id", async ({ page }, info) => {
    for (const { nome, caminho } of await rotasComId(page)) {
      await page.goto(caminho, { waitUntil: "networkidle" });
      await page.screenshot({ path: `e2e/capturas/${nome}-${info.project.name}.png`, fullPage: true });
    }
  });

  // A história "Como funciona" é uma cena fixa que avança com a rolagem: uma captura por cena.
  test("home: cenas da história", async ({ page }, info) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const total = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("#como-funciona")!;
      return { topo: el.offsetTop, altura: el.offsetHeight, janela: window.innerHeight };
    });
    for (const [rotulo, p] of [["pagina", 0.05], ["atendente", 0.5], ["visita", 0.95]] as const) {
      await page.evaluate(([topo, altura, janela, prog]) => window.scrollTo(0, topo + (altura - janela) * prog), [total.topo, total.altura, total.janela, p]);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `e2e/capturas/home-historia-${rotulo}-${info.project.name}.png` });
    }
  });
});
