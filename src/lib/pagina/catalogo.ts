import { valorDoCampo, type EntradaRoteiro } from "./entrada";

// Perguntas que o Atendente consegue responder com a ficha (spec: "só perguntas que o Atendente responde").
// Cada uma só entra se o campo que a sustenta está preenchido. "Quero agendar uma visita" fecha a lista.

export type PerguntaPadrao = { tema: string; pergunta: string; vale: (e: EntradaRoteiro) => boolean };

const tem = (e: EntradaRoteiro, campo: string) => valorDoCampo(e, campo) !== undefined;

export const PERGUNTAS: PerguntaPadrao[] = [
  { tema: "Financiamento", pergunta: "Aceita financiamento?", vale: (e) => typeof e.imovel.aceitaFinanciamento === "boolean" },
  { tema: "Financiamento", pergunta: "Aceita FGTS?", vale: (e) => e.imovel.aceitaFgts !== null && e.imovel.aceitaFgts !== undefined },
  { tema: "Custos", pergunta: "Quanto é o condomínio?", vale: (e) => tem(e, "imovel.condominio") },
  { tema: "Custos", pergunta: "Quanto é o IPTU?", vale: (e) => tem(e, "imovel.iptu") },
  { tema: "Bairro", pergunta: "Tem escola perto?", vale: (e) => tem(e, "imovel.infoBairro.escolas") },
  { tema: "Bairro", pergunta: "Tem mercado perto?", vale: (e) => tem(e, "imovel.infoBairro.mercados") },
  { tema: "O imóvel", pergunta: "Quantas vagas tem?", vale: (e) => tem(e, "imovel.vagas") },
  { tema: "O imóvel", pergunta: "Qual é a área?", vale: (e) => tem(e, "imovel.areaM2") },
  { tema: "Visita", pergunta: "Quero agendar uma visita", vale: () => true },
];

export const PERGUNTA_FINAL = "Quero agendar uma visita";

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[?!.\s]+$/g, "").trim();

export function perguntaDoCatalogo(texto: string): PerguntaPadrao | undefined {
  return PERGUNTAS.find((p) => norm(p.pergunta) === norm(texto));
}

/** Perguntas disponíveis para esta ficha, na ordem do catálogo. */
export function perguntasValidas(e: EntradaRoteiro): PerguntaPadrao[] {
  return PERGUNTAS.filter((p) => p.vale(e));
}
