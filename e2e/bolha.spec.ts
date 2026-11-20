import { expect, test, type Page } from "@playwright/test";
import { SLUG_PUBLICADO, SLUG_VENDIDO } from "./rotas";

// Bolha de chat no atendente simulado (a IA fica desligada pelo playwright.config.ts).

const PAGINA = `/imovel/${SLUG_PUBLICADO}`;

async function abrirPelaBarra(page: Page, nome: RegExp) {
  await page.goto(PAGINA);
  await page.getByRole("button", { name: nome }).first().click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  return dialogo;
}

test.describe("bolha de chat", () => {
  test("abre por 'Agendar visita' direto no agendamento e conclui o pedido", async ({ page }) => {
    const dialogo = await abrirPelaBarra(page, /^Agendar visita$/);
    await expect(dialogo.getByText(/assistente virtual de Corretor de Exemplo/).first()).toBeVisible();

    // O simulado oferece horários como botões.
    const horarios = dialogo.getByRole("list", { name: "Sugestões de resposta" }).getByRole("button");
    await expect(horarios.first()).toBeVisible();
    await horarios.first().click();

    const campo = dialogo.getByRole("textbox", { name: "Sua mensagem" });
    await campo.fill("Maria Teste");
    await campo.press("Enter");
    await campo.fill("47999990000");
    await campo.press("Enter");

    await dialogo.getByRole("list", { name: "Consentimento" }).getByRole("button", { name: /^Autorizo$/ }).click();
    await expect(dialogo.getByText(/Pedido de visita enviado/)).toBeVisible();
  });

  test("Esc fecha e devolve o foco ao botão que abre a conversa", async ({ page }) => {
    const dialogo = await abrirPelaBarra(page, /^Tirar dúvidas$|^Falar com o corretor$/);
    await expect(dialogo.getByRole("textbox", { name: "Sua mensagem" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();
    await expect(page.getByRole("button", { name: /Abrir conversa com o atendente virtual/ })).toBeFocused();
  });

  test("não tem bolha em imóvel vendido", async ({ page }) => {
    await page.goto(`/imovel/${SLUG_VENDIDO}`);
    await expect(page.getByText("Este imóvel foi vendido")).toBeVisible();
    await page.waitForTimeout(2500); // a bolha carrega em tempo ocioso
    await expect(page.getByRole("button", { name: /Abrir conversa/ })).toHaveCount(0);
  });

  test("com 30 mensagens do comprador a conversa encerra e some o campo de texto (RN-16)", async ({ page }) => {
    const mensagens = Array.from({ length: 30 }, (_, i) => [
      { id: `u${i}`, papel: "usuario", texto: `pergunta ${i}` },
      { id: `a${i}`, papel: "assistente", texto: `resposta ${i}` },
    ]).flat();
    await page.addInitScript(
      ([chave, valor]) => window.localStorage.setItem(chave, valor),
      ["showing:conversa:mock-1", JSON.stringify({ mensagens, estado: { fase: "livre" }, conversaId: null, encerrada: false })],
    );

    const dialogo = await abrirPelaBarra(page, /^Falar com o corretor$/);
    await expect(dialogo.getByText(/chegou ao limite de mensagens/)).toBeVisible();
    await expect(dialogo.getByRole("textbox", { name: "Sua mensagem" })).toHaveCount(0);
    await expect(dialogo.getByRole("link", { name: "Chamar no WhatsApp" })).toBeVisible();
  });
});
