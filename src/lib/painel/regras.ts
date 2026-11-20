import type { ImovelPainel } from "./tipos";
import { FOTOS_MINIMAS } from "./schema";

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugificar(texto: string) {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type BaseSlug = Pick<ImovelPainel, "tipo" | "quartos" | "bairro" | "cidade">;

/** RN-03: tipo + quartos + bairro + cidade; sufixo numérico se já existir. */
export function gerarSlug({ tipo, quartos, bairro, cidade }: BaseSlug, existentes: Set<string>): string {
  const partes = [
    slugificar(tipo.replace("_", " ")),
    quartos > 0 ? `${quartos}-${quartos === 1 ? "quarto" : "quartos"}` : "",
    slugificar(bairro),
    slugificar(cidade),
  ].filter(Boolean);
  const base = partes.join("-");

  let slug = base;
  for (let n = 2; existentes.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** RN-02: o que falta para publicar. Lista vazia = pode publicar. */
export function faltaParaPublicar(i: ImovelPainel): string[] {
  const falta: string[] = [];
  if (!i.titulo.trim()) falta.push("título");
  if (!i.descricao.trim()) falta.push("descrição");
  if (!(i.preco > 0)) falta.push("preço");
  if (!i.bairro.trim()) falta.push("bairro");
  if (!(i.areaM2 > 0)) falta.push("área");
  if (i.quartos == null) falta.push("quartos");
  if (i.banheiros == null) falta.push("banheiros");
  if (i.vagas == null) falta.push("vagas");
  if (i.fotos.length < FOTOS_MINIMAS) {
    falta.push(`pelo menos ${FOTOS_MINIMAS} fotos (hoje ${i.fotos.length})`);
  }
  return falta;
}
