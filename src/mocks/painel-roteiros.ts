import type { Roteiro } from "@/lib/pagina/roteiro";
import type { RelatorioRoteiro, VersaoDoRoteiro } from "@/lib/pagina/tipos";

// Roteiros em memória (USAR_MOCKS=1). A versão Prisma é src/lib/pagina/repositorio-db.ts.

const g = globalThis as unknown as { __showingRoteiros?: VersaoDoRoteiro[] };
const lista = () => (g.__showingRoteiros ??= []);
export const reiniciarRoteiros = () => (g.__showingRoteiros = []);

const clone = <T>(v: T): T => structuredClone(v);
const doImovel = (imovelId: string) => lista().filter((v) => v.imovelId === imovelId);

export async function ultimaVersao(imovelId: string) {
  const v = doImovel(imovelId).sort((a, b) => b.versao - a.versao)[0];
  return v ? clone(v) : null;
}

export async function versaoAprovada(imovelId: string) {
  const v = doImovel(imovelId).filter((x) => x.aprovado).sort((a, b) => b.versao - a.versao)[0];
  return v ? clone(v) : null;
}

export async function criarVersao(imovelId: string, conteudo: Roteiro, relatorio: RelatorioRoteiro) {
  const versao = Math.max(0, ...doImovel(imovelId).map((v) => v.versao)) + 1;
  const nova: VersaoDoRoteiro = { id: `roteiro-${imovelId}-${versao}`, imovelId, versao, conteudo: clone(conteudo), relatorio: clone(relatorio), aprovado: false, atualizadoEm: new Date() };
  lista().push(nova);
  return clone(nova);
}

export async function atualizarVersao(id: string, conteudo: Roteiro, relatorio: RelatorioRoteiro) {
  const v = lista().find((x) => x.id === id);
  if (v) Object.assign(v, { conteudo: clone(conteudo), relatorio: clone(relatorio), atualizadoEm: new Date() });
}

export async function aprovarVersao(imovelId: string, id: string) {
  for (const v of doImovel(imovelId)) v.aprovado = v.id === id;
}

export async function desaprovarTodas(imovelId: string) {
  for (const v of doImovel(imovelId)) v.aprovado = false;
}
