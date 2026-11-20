import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { rotasComId, TODAS_AS_ROTAS } from "./rotas";

// Acessibilidade automática (WCAG 2.0/2.1 A e AA). Falha em violação grave ou crítica.
// O axe cobre só parte do que importa: foco, teclado e leitores de tela seguem em revisão manual.
async function varrer(page: import("@playwright/test").Page, caminho: string) {
  await page.goto(caminho, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // deixa as animações de entrada terminarem (a página inicial escreve o título)
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const graves = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const resumo = graves.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(resumo, `violações em ${caminho}`).toEqual([]);
}

test.describe("acessibilidade (axe)", () => {
  for (const { nome, caminho } of TODAS_AS_ROTAS) {
    test(nome, async ({ page }) => {
      await varrer(page, caminho);
    });
  }

  test("rotas com id (conversa e cliente)", async ({ page }) => {
    for (const { caminho } of await rotasComId(page)) await varrer(page, caminho);
  });
});
