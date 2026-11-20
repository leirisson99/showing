import { repositorioMockGlobal } from "@/mocks/atendimento";
import type { RepositorioAtendimento } from "./repositorio";

// TODO(backend): devolver a implementação Prisma (Conversa, Visita, User.horariosVisita).
// É o único ponto que a rota de chat usa para escolher o repositório.
export function obterRepositorio(): RepositorioAtendimento {
  return repositorioMockGlobal();
}
