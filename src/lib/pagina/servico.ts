import { iaConfigurada } from "@/lib/ai/modelo";
import { usarMocks } from "@/lib/mocks";
import { buscarImovel } from "@/lib/painel/imoveis";
import { gerarRoteiroComIA } from "./agente";
import { entradaDoImovel } from "./entrada";
import { alertasDaFicha, roteiroPadrao } from "./padrao";
import type { Roteiro } from "./roteiro";
import type { RelatorioRoteiro, VersaoDoRoteiro } from "./tipos";
import { validarRoteiro } from "./validador";

// Diretor da Página: gerar, editar, aprovar. Toda função recebe `corretorId` e só mexe em imóvel dele (RN-07).
// Nada vai ao ar sem o corretor aprovar (RN-06): gerar e editar só mexem no rascunho.

const repo = async () => (usarMocks() ? await import("@/mocks/painel-roteiros") : await import("./repositorio-db"));

export type Falha = { ok: false; erro: string; precisaConfirmar?: boolean };
export type Sucesso<T> = { ok: true } & T;

const naoEncontrado: Falha = { ok: false, erro: "Imóvel não encontrado." };
const MINIMO_DE_FOTOS = 3;

function relatorioDe(roteiro: Roteiro, origem: RelatorioRoteiro["origem"], extra: Partial<RelatorioRoteiro> = {}): RelatorioRoteiro {
  const campos = new Set<string>();
  const ver = (t: { fontes: { campo: string }[] }) => t.fontes.forEach((f) => f.campo !== "sistema" && campos.add(f.campo));
  for (const c of roteiro.capitulos) {
    if (c.tipo === "ambientes_fixo") c.quadros.forEach((q) => ver(q.frase));
    else ver(c.titulo);
    if (c.tipo === "numeros") c.itens.forEach((i) => campos.add(i.campo));
  }
  return { origem, camposUsados: [...campos].sort(), alertas: roteiro.alertas, ...extra };
}

export async function buscarPaginaDoPainel(corretorId: string, imovelId: string): Promise<{ rascunho: VersaoDoRoteiro | null; aprovada: VersaoDoRoteiro | null } | null> {
  if (!(await buscarImovel(corretorId, imovelId))) return null;
  const r = await repo();
  const ultima = await r.ultimaVersao(imovelId);
  return { rascunho: ultima && !ultima.aprovado ? ultima : null, aprovada: await r.versaoAprovada(imovelId) };
}

/** Roteiro que o comprador vê (aprovado), ou nulo para usar a página padrão. */
export async function roteiroAprovado(imovelId: string): Promise<VersaoDoRoteiro | null> {
  return (await repo()).versaoAprovada(imovelId);
}

/** Pré-visualização: o rascunho mais recente (ou o aprovado, se não há rascunho). */
export async function roteiroDaPrevia(corretorId: string, imovelId: string): Promise<VersaoDoRoteiro | null> {
  if (!(await buscarImovel(corretorId, imovelId))) return null;
  return (await repo()).ultimaVersao(imovelId);
}

type Pedido = { instrucao?: string; confirmarSobrescrita?: boolean };

export async function gerarPagina(corretorId: string, imovelId: string, { instrucao, confirmarSobrescrita }: Pedido = {}): Promise<Falha | Sucesso<{ versao: VersaoDoRoteiro }>> {
  const imovel = await buscarImovel(corretorId, imovelId);
  if (!imovel) return naoEncontrado;
  if (imovel.fotos.length < MINIMO_DE_FOTOS) return { ok: false, erro: `Envie pelo menos ${MINIMO_DE_FOTOS} fotos para montar a página.` };

  const r = await repo();
  const ultima = await r.ultimaVersao(imovelId);
  // Edições do corretor nunca são sobrescritas sem confirmação.
  if (ultima && !ultima.aprovado && ultima.relatorio.editado && !confirmarSobrescrita) {
    return { ok: false, precisaConfirmar: true, erro: "Você editou o rascunho atual. Gerar de novo cria outra versão e o rascunho editado deixa de ser a versão aberta." };
  }

  const entrada = entradaDoImovel(imovel);
  let roteiro: Roteiro;
  let origem: RelatorioRoteiro["origem"] = "padrao";
  let tentativas: number | undefined;

  if (iaConfigurada()) {
    const g = await gerarRoteiroComIA(entrada, { instrucao });
    if (!g.ok) return { ok: false, erro: g.erro };
    roteiro = g.roteiro;
    origem = "ia";
    tentativas = g.tentativas;
  } else {
    roteiro = roteiroPadrao(entrada);
  }

  // Os alertas vêm do código (campos faltando, fotos sem legenda): o modelo às vezes os repete com os nomes internos das fotos.
  roteiro = { ...roteiro, alertas: alertasDaFicha(entrada) };
  // Última conferência, mesmo para o que veio do código: o que vai para o corretor sempre passou pelo validador.
  const v = validarRoteiro(roteiro, entrada);
  if (!v.ok) {
    console.error("pagina: roteiro reprovado na conferência final", { erros: v.erros.length });
    return { ok: false, erro: "Não consegui montar a página. Tente de novo." };
  }

  const versao = await r.criarVersao(imovelId, v.roteiro, relatorioDe(v.roteiro, origem, { instrucao: instrucao?.trim() || undefined, tentativas }));
  return { ok: true, versao };
}

/** O corretor editou o texto ou tirou um capítulo. Vale o que ele escreveu (sem exigir fonte), com as mesmas regras de voz. */
export async function editarPagina(corretorId: string, imovelId: string, novo: unknown): Promise<Falha | Sucesso<{ versao: VersaoDoRoteiro }>> {
  const imovel = await buscarImovel(corretorId, imovelId);
  if (!imovel) return naoEncontrado;
  const r = await repo();
  const ultima = await r.ultimaVersao(imovelId);
  if (!ultima) return { ok: false, erro: "Gere a página antes de editar." };

  const v = validarRoteiro(novo, entradaDoImovel(imovel), { editado: true });
  if (!v.ok) return { ok: false, erro: v.erros.join(" ") };

  const relatorio: RelatorioRoteiro = { ...ultima.relatorio, editado: true, alertas: v.roteiro.alertas };
  if (ultima.aprovado) return { ok: true, versao: await r.criarVersao(imovelId, v.roteiro, relatorio) }; // a versão no ar só muda quando ele aprovar de novo
  await r.atualizarVersao(ultima.id, v.roteiro, relatorio);
  return { ok: true, versao: { ...ultima, conteudo: v.roteiro, relatorio, atualizadoEm: new Date() } };
}

export async function aprovarPagina(corretorId: string, imovelId: string): Promise<Falha | Sucesso<{ slug: string }>> {
  const imovel = await buscarImovel(corretorId, imovelId);
  if (!imovel) return naoEncontrado;
  const r = await repo();
  const ultima = await r.ultimaVersao(imovelId);
  if (!ultima) return { ok: false, erro: "Gere a página antes de aprovar." };
  const v = validarRoteiro(ultima.conteudo, entradaDoImovel(imovel), { editado: Boolean(ultima.relatorio.editado) });
  if (!v.ok) return { ok: false, erro: `A página não passa nas regras: ${v.erros[0]}` };
  await r.aprovarVersao(imovelId, ultima.id);
  return { ok: true, slug: imovel.slug };
}

/** Volta para a página padrão (sem capítulos). A versão fica guardada. */
export async function usarPaginaPadrao(corretorId: string, imovelId: string): Promise<Falha | Sucesso<{ slug: string }>> {
  const imovel = await buscarImovel(corretorId, imovelId);
  if (!imovel) return naoEncontrado;
  await (await repo()).desaprovarTodas(imovelId);
  return { ok: true, slug: imovel.slug };
}
