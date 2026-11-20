// Interruptor único dos mocks de desenvolvimento (USAR_MOCKS=1 no .env).
// Nunca vale em produção, mesmo que a variável esteja definida.
export function usarMocks(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.USAR_MOCKS === "1";
}

export const CORRETOR_MOCK = {
  id: "mock-corretor",
  email: "corretor@exemplo.com",
  name: "Corretor de Exemplo" as string | null,
};

/** Dados de exemplo (conversas, visitas, eventos) só no desenvolvimento; os testes partem da memória vazia. */
export function semearExemplos(): boolean {
  return usarMocks() && !process.env.VITEST;
}
