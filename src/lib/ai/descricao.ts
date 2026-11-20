import { formatarArea } from "@/lib/format";
import { TIPOS, type DadosImovel } from "@/lib/painel/schema";

export type FichaDescricao = Pick<
  DadosImovel,
  | "tipo"
  | "finalidade"
  | "bairro"
  | "cidade"
  | "quartos"
  | "suites"
  | "banheiros"
  | "vagas"
  | "areaM2"
  | "aceitaFinanciamento"
  | "aceitaFgts"
  | "caracteristicas"
  | "infoAdicional"
>;

export type TextoGerado = { titulo: string; descricao: string };

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// MOCK: monta o texto por modelo, usando só os dados da ficha (RN-06: é rascunho, o
// corretor revisa e salva). Quando o modelo de IA for configurado, esta função passa a
// chamá-lo com a mesma ficha e o mesmo retorno; nada fora daqui muda.
export async function gerarTituloEDescricao(f: FichaDescricao): Promise<TextoGerado> {
  const tipo = TIPOS[f.tipo];
  const acao = f.finalidade === "venda" ? "à venda" : "para alugar";
  const comodos = f.tipo === "terreno" || f.tipo === "sala_comercial" ? null : plural(f.quartos, "quarto", "quartos");

  const titulo = `${tipo}${comodos ? ` de ${comodos}` : ""} no ${f.bairro}`;

  const medidas = [
    comodos && (f.suites ? `${comodos}, sendo ${plural(f.suites, "suíte", "suítes")}` : comodos),
    f.banheiros > 0 ? plural(f.banheiros, "banheiro", "banheiros") : null,
    f.vagas > 0 ? plural(f.vagas, "vaga de garagem", "vagas de garagem") : null,
    `${formatarArea(f.areaM2)} de área`,
  ].filter(Boolean);

  const paragrafos = [`${tipo} ${acao} no bairro ${f.bairro}, em ${f.cidade}, com ${medidas.join(", ")}.`];
  if (f.caracteristicas.length > 0) paragrafos.push(`Destaques: ${f.caracteristicas.join(", ").toLowerCase()}.`);

  const pagamento = [f.aceitaFinanciamento && "financiamento", f.aceitaFgts && "FGTS"].filter(Boolean);
  if (pagamento.length > 0) paragrafos.push(`Aceita ${pagamento.join(" e ")}.`);
  if (f.infoAdicional) paragrafos.push(f.infoAdicional);

  return { titulo, descricao: paragrafos.join("\n\n") };
}
