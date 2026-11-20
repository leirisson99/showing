import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Os testes de regra rodam sobre os mocks em memória, sem banco.
    env: { USAR_MOCKS: "1" },
  },
});
