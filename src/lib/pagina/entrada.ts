import type { ImovelPainel } from "@/lib/painel/tipos";

// O que o Diretor da Página lê do cadastro. O imóvel vem da sessão do servidor, nunca de argumento do modelo.

export type FotoDoRoteiro = { id: string; ordem: number; legenda: string | null };

export type EntradaRoteiro = {
  imovel: Pick<
    ImovelPainel,
    | "tipo" | "finalidade" | "bairro" | "cidade" | "endereco" | "mostrarEndereco" | "preco" | "condominio" | "iptu" | "quartos" | "suites" | "banheiros" | "vagas"
    | "areaM2" | "aceitaFinanciamento" | "aceitaFgts" | "caracteristicas" | "infoAdicional" | "infoBairro"
  >;
  fotos: FotoDoRoteiro[];
};

export function entradaDoImovel(i: ImovelPainel): EntradaRoteiro {
  return { imovel: i, fotos: [...i.fotos].sort((a, b) => a.ordem - b.ordem).map((f) => ({ id: f.id, ordem: f.ordem, legenda: f.legenda })) };
}

const NUMERICOS = ["quartos", "suites", "banheiros", "vagas", "areaM2", "preco", "condominio", "iptu"] as const;
const ALIAS: Record<string, string> = { area: "areaM2" };

/**
 * Valor de um campo citado em `fontes` (ex.: "imovel.quartos", "imovel.caracteristicas[2]", "foto:abc").
 * Devolve `undefined` quando o campo não existe ou não está preenchido, e é assim que a fonte falha.
 */
export function valorDoCampo(e: EntradaRoteiro, campo: string): unknown {
  if (campo === "sistema") return true;
  if (campo === "fotos") return e.fotos.length > 0 ? e.fotos.length : undefined;
  if (campo.startsWith("foto:")) return e.fotos.find((f) => f.id === campo.slice(5)) ? true : undefined;
  if (!campo.startsWith("imovel.")) return undefined;

  const caminho = campo.slice("imovel.".length);
  const lista = caminho.match(/^caracteristicas\[(\d+)\]$/);
  if (lista) return e.imovel.caracteristicas[Number(lista[1])] || undefined;

  const bairro = caminho.match(/^infoBairro\.(escolas|mercados|saude|distanciaCentro)$/);
  if (bairro) {
    const v = e.imovel.infoBairro?.[bairro[1] as "escolas" | "mercados" | "saude" | "distanciaCentro"];
    return Array.isArray(v) ? (v.length > 0 ? v : undefined) : v || undefined;
  }

  const chave = (ALIAS[caminho] ?? caminho) as keyof EntradaRoteiro["imovel"];
  if (!(chave in e.imovel)) return undefined;
  const v = e.imovel[chave];
  if (v === null || v === undefined || v === "") return undefined;
  if (Array.isArray(v)) return v.length > 0 ? v : undefined;
  if ((NUMERICOS as readonly string[]).includes(chave as string)) return typeof v === "number" ? v : undefined;
  return v;
}

/** Campo numérico com valor maior que zero (quartos, área, vagas...). */
export function numeroDoCampo(e: EntradaRoteiro, campo: string): number | null {
  const v = valorDoCampo(e, campo);
  return typeof v === "number" && v > 0 ? v : null;
}
