import { expect, test } from "@playwright/test";

// Página em capítulos sobre os dados de exemplo (mocks): gerar, revisar, aprovar e ver a página pública.
test.describe("página em capítulos", () => {
  test("gera pelo painel, edita um texto, aprova e a página pública usa os capítulos", async ({ page }) => {
    await page.goto("/painel/imoveis/mock-1?aba=pagina");
    await expect(page.getByRole("heading", { name: "Página em capítulos" })).toBeVisible();

    await page.getByRole("button", { name: /Gerar página|Gerar de novo/ }).click(); // a memória de exemplo pode já ter um rascunho de outra rodada
    await expect(page.getByRole("heading", { name: "Relatório da geração" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Modelo\s+essencial|Modelo\s+família/)).toBeVisible();

    // Edita o título da chegada e salva.
    const titulo = page.getByLabel("Título", { exact: true }).first();
    await titulo.fill("Apartamento com sacada no Victor Konder");
    await page.getByRole("button", { name: "Salvar edições" }).click();
    await expect(page.getByText("Edições salvas")).toBeVisible();

    await page.getByRole("button", { name: "Usar esta página" }).click();
    await expect(page.getByText(/No ar: página em capítulos/)).toBeVisible({ timeout: 10_000 });

    await page.goto("/imovel/apartamento-2-quartos-victor-konder-blumenau");
    await expect(page.getByRole("heading", { level: 1, name: /Apartamento com sacada no Victor Konder/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Capítulos" })).toBeAttached();
    await expect(page.getByText("página criada com Showing")).toBeVisible();

    // Volta para a página padrão: o resto da suíte espera a página original.
    await page.goto("/painel/imoveis/mock-1?aba=pagina");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Voltar para a página padrão" }).click();
    await expect(page.getByText(/No ar: página em capítulos/)).toBeHidden({ timeout: 10_000 });
  });
});
