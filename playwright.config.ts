import { defineConfig } from "@playwright/test";

// Testes de navegador (docs/pages.md, checklist §6). Sobem o app em desenvolvimento numa
// porta e num diretório de build próprios, com os dados de exemplo ligados e a IA desligada
// (a bolha usa o atendente simulado e nenhum token é gasto).
const PORTA = 3100;

export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/resultados",
  // O estado de exemplo fica na memória do servidor: testes em série evitam interferência.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/relatorio" }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `node_modules/.bin/next dev -p ${PORTA}`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    env: { NEXT_DIST_DIR: ".next-e2e", USAR_MOCKS: "1", AI_API_KEY: "", AI_MODEL: "" },
  },
});
