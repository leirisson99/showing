import { usarMocks } from "@/lib/mocks";
import { repositorioMockGlobal } from "@/mocks/atendimento";
import { criarRepositorioDb } from "./repositorio-db";
import type { RepositorioAtendimento } from "./repositorio";

// Único ponto que a rota de chat usa para escolher o repositório: memória com USAR_MOCKS=1,
// senão o Prisma (uma instância por requisição).
export function obterRepositorio(): RepositorioAtendimento {
  return usarMocks() ? repositorioMockGlobal() : criarRepositorioDb();
}
