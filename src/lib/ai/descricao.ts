import { Agent, type Model } from "@strands-agents/sdk";
import { z } from "zod";
import { formatarArea } from "@/lib/format";
import { TIPOS, type DadosImovel } from "@/lib/painel/schema";
import { iaConfigurada, criarModelo } from "./modelo";
import { registrarUso } from "./uso";

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

// RN-06: o texto é só um rascunho; o corretor revisa e salva. Usa a IA quando está configurada e,
// se ela falhar ou inventar algo, cai no texto montado só com os dados da ficha (abaixo).
export async function gerarTituloEDescricao(f: FichaDescricao, modelo?: Model): Promise<TextoGerado> {
  if (modelo || iaConfigurada()) {
    try {
      const texto = await gerarComIA(f, modelo ?? criarModelo());
      if (texto) return texto;
    } catch {
      console.error("ia: falha ao gerar a descrição; usando o texto padrão");
    }
  }
  return gerarPorModelo(f);
}

const resposta = z.object({
  titulo: z.string().trim().min(5).max(120),
  descricao: z.string().trim().min(20).max(5000),
});

const INSTRUCOES = `Você escreve o título e a descrição de um anúncio de imóvel em português do Brasil, para o corretor revisar.
Use SOMENTE os dados da ficha recebida. Nunca invente nem estime preço, metragem, quantidade de cômodos, endereço, andar, ano, condição, localização exata, proximidade de lugares ou qualquer característica que não esteja na ficha.
Tom cordial e direto, sem exagero nem superlativos. O título tem no máximo 80 caracteres. A descrição tem de 2 a 4 parágrafos curtos, separados por linha em branco.
Responda APENAS com um objeto JSON: {"titulo": "...", "descricao": "..."}.`;

function fichaEmTexto(f: FichaDescricao): string {
  return [
    `Tipo: ${TIPOS[f.tipo]}; finalidade: ${f.finalidade}`,
    `Bairro: ${f.bairro}; cidade: ${f.cidade}`,
    `Quartos: ${f.quartos}; suítes: ${f.suites ?? "não informado"}; banheiros: ${f.banheiros}; vagas: ${f.vagas}`,
    `Área: ${formatarArea(f.areaM2)}`,
    `Aceita financiamento: ${f.aceitaFinanciamento ? "sim" : "não"}; aceita FGTS: ${f.aceitaFgts ? "sim" : "não"}`,
    `Características: ${f.caracteristicas.length ? f.caracteristicas.join(", ") : "nenhuma informada"}`,
    `Informações do corretor: ${f.infoAdicional ?? "nenhuma"}`,
  ].join("\n");
}

/** Números que podem aparecer no texto: os da ficha. Qualquer outro é invenção do modelo. */
function numerosPermitidos(f: FichaDescricao): Set<string> {
  const digitos = (t: string) => t.match(/\d+/g) ?? [];
  const origem = [String(f.quartos), String(f.suites ?? ""), String(f.banheiros), String(f.vagas), String(f.areaM2), formatarArea(f.areaM2), ...f.caracteristicas, f.infoAdicional ?? "", f.bairro, f.cidade];
  return new Set(origem.flatMap(digitos));
}

async function gerarComIA(f: FichaDescricao, modelo: Model): Promise<TextoGerado | null> {
  const agente = new Agent({ model: modelo, systemPrompt: INSTRUCOES, printer: false });
  const r = await agente.invoke(fichaEmTexto(f));
  const uso = r.metrics?.accumulatedUsage;
  void registrarUso("descricao", { entrada: uso?.inputTokens ?? 0, saida: uso?.outputTokens ?? 0 });

  const bruto = r.lastMessage.content.map((b) => ("text" in b && typeof b.text === "string" ? b.text : "")).join("");
  const json = bruto.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  const lido = resposta.safeParse(JSON.parse(json));
  if (!lido.success) return null;

  // Guarda contra invenção: todo número do texto precisa estar na ficha.
  const permitidos = numerosPermitidos(f);
  const usados = `${lido.data.titulo} ${lido.data.descricao}`.match(/\d+/g) ?? [];
  if (usados.some((n) => !permitidos.has(n))) return null;
  // Nem preço: a ficha desta função não o recebe, então qualquer "R$" é invenção.
  if (/R\$/.test(lido.data.descricao)) return null;
  return lido.data;
}

/** Texto montado só com os dados da ficha, sem IA. */
export function gerarPorModelo(f: FichaDescricao): TextoGerado {
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
