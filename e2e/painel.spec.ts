import path from "node:path";
import { expect, test } from "@playwright/test";

const FOTO = path.join(__dirname, "fixtures", "foto.png");

test.describe("painel", () => {
  test("perfil: salva nome e um horário novo", async ({ page }) => {
    await page.goto("/painel/perfil");
    await page.getByLabel("Nome", { exact: true }).fill("Corretor de Exemplo");
    await page.getByLabel("Novo horário de Domingo").fill("15:00");
    await page.getByRole("button", { name: "Adicionar" }).nth(0).click();
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo")).toBeVisible();
  });

  test("visitas: confirma e cancela", async ({ page }) => {
    await page.goto("/painel/visitas");
    await page.getByRole("button", { name: "Confirmar visita" }).first().click();
    await expect(page.getByText("Visita confirmada")).toBeVisible();

    await page.getByRole("button", { name: "Cancelar visita" }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar visita" }).click();
    await expect(page.getByText("Visita cancelada")).toBeVisible();
  });

  test("imóvel: cadastra, envia fotos, publica e abre a página pública", async ({ page }) => {
    await page.goto("/painel/imoveis/novo");

    await page.getByRole("combobox", { name: "Tipo" }).click();
    await page.getByRole("option", { name: "Apartamento" }).click();
    await page.getByLabel("Bairro").fill("Garcia");
    await page.getByLabel("Preço (R$)").fill("350000");
    await page.getByLabel("Área (m²)").fill("60");
    await page.getByLabel("Quartos", { exact: true }).fill("2");
    await page.getByLabel("Banheiros").fill("1");
    await page.getByLabel("Vagas de garagem").fill("1");
    await page.getByRole("button", { name: /Gerar título e descrição/ }).click();
    await expect(page.getByLabel("Título")).not.toHaveValue("");

    await page.getByRole("button", { name: /Salvar e continuar/ }).click();
    await page.waitForURL(/\/painel\/imoveis\/imovel-/);

    for (let i = 0; i < 3; i++) {
      await page.locator("#fotos").setInputFiles(FOTO);
      await expect(page.getByText(new RegExp(`^${i + 1} (foto|fotos)\\.`))).toBeVisible();
    }

    await page.getByRole("button", { name: "Publicar imóvel" }).click();
    await expect(page.getByText("Imóvel publicado")).toBeVisible();

    const url = await page.getByText(/\/imovel\/apartamento-2-quartos-garcia/).first().textContent();
    const caminho = new URL(url!.trim()).pathname;
    await page.goto(caminho);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("conversas: transferida em destaque e histórico abre", async ({ page }) => {
    await page.goto("/painel/conversas");
    await expect(page.getByText(/Passou para você/).first()).toBeVisible();
    await page.locator('a[href^="/painel/conversas/"]').first().click();
    await expect(page.getByRole("heading", { name: "Conversa" })).toBeVisible();
  });
});
