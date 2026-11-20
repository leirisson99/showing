import { CORRETOR_MOCK } from "@/lib/mocks";
import type { ImovelPainel } from "@/lib/painel/tipos";
import { imoveisMock } from "./imoveis";

// Banco em memória do painel (só com USAR_MOCKS=1). Some ao reiniciar o servidor.
// Quando o Prisma entrar, src/lib/painel/imoveis.ts deixa de usar isto.

type Store = { imoveis: ImovelPainel[] };

function semear(): Store {
  return {
    imoveis: imoveisMock.map((m) => {
      const imovel: ImovelPainel & { corretor?: unknown } = {
        ...m,
        corretorId: CORRETOR_MOCK.id,
        publicadoEm: "2026-11-01T12:00:00.000Z",
        fotos: m.fotos.map((f, i) => ({
          id: `${m.id}-foto-${i}`,
          fileId: `mock-unsplash:${f.src.match(/photo-[\w-]+/)![0]}`,
          legenda: f.legenda,
          ordem: i,
        })),
      };
      delete imovel.corretor; // o corretor vem de CORRETOR_MOCK, não do imóvel
      return imovel;
    }),
  };
}

const g = globalThis as unknown as { __showingStore?: Store };

export function store(): Store {
  return (g.__showingStore ??= semear());
}

export function reiniciarStore() {
  g.__showingStore = semear();
}
