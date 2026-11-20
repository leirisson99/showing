import { usarMocks } from "@/lib/mocks";
import type { DadosImovel } from "./schema";
import type { ImovelPainel } from "./tipos";

// Operações do corretor sobre os próprios imóveis. Toda função recebe `corretorId` e só enxerga
// imóveis dele (RN-07, RNF-08): imóvel de outro corretor se comporta como inexistente.
// Com USAR_MOCKS=1 usa a memória (src/mocks/painel-imoveis.ts); senão, o Prisma (imoveis-db.ts).

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; erro: string };
type Com = Resultado<{ imovel: ImovelPainel }>;

const repo = async () => (usarMocks() ? await import("@/mocks/painel-imoveis") : await import("./imoveis-db"));

export const listarImoveis = async (corretorId: string): Promise<ImovelPainel[]> => (await repo()).listarImoveis(corretorId);
export const buscarImovel = async (corretorId: string, id: string): Promise<ImovelPainel | null> => (await repo()).buscarImovel(corretorId, id);
export const criarImovel = async (corretorId: string, dados: DadosImovel): Promise<ImovelPainel> => (await repo()).criarImovel(corretorId, dados);
export const atualizarImovel = async (corretorId: string, id: string, dados: DadosImovel): Promise<Com> => (await repo()).atualizarImovel(corretorId, id, dados);
export const publicarImovel = async (corretorId: string, id: string): Promise<Com> => (await repo()).publicarImovel(corretorId, id);
export const despublicarImovel = async (corretorId: string, id: string): Promise<Com> => (await repo()).despublicarImovel(corretorId, id);
export const marcarVendido = async (corretorId: string, id: string): Promise<Com> => (await repo()).marcarVendido(corretorId, id);
export const excluirImovel = async (corretorId: string, id: string): Promise<Resultado<{ slug: string }>> => (await repo()).excluirImovel(corretorId, id);
export const adicionarFoto = async (corretorId: string, id: string, fileId: string): Promise<Com> => (await repo()).adicionarFoto(corretorId, id, fileId);
export const removerFotoDoImovel = async (corretorId: string, id: string, fotoId: string): Promise<Com> => (await repo()).removerFotoDoImovel(corretorId, id, fotoId);
export const moverFoto = async (corretorId: string, id: string, fotoId: string, direcao: -1 | 1): Promise<Com> => (await repo()).moverFoto(corretorId, id, fotoId, direcao);
export const legendarFoto = async (corretorId: string, id: string, fotoId: string, legenda: string): Promise<Resultado> => (await repo()).legendarFoto(corretorId, id, fotoId, legenda);
