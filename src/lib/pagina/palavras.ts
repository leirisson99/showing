// Linguagem que o Diretor da Página não pode usar (docs/agent-diretor-pagina.md, "Proibido").

const sem = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Superlativo sem prova, urgência falsa, promessa de desconto ou negociação, termos que excluem pessoas.
const PROIBIDAS: [RegExp, string][] = [
  [/\b(melhor|melhores|unic[oa]s?|imperdivel|imperdiveis|incrivel|incriveis|espetacular|maravilhos[oa]s?|perfeit[oa]s?|dos sonhos)\b/, "superlativo sem prova"],
  [/\boportunidade\b/, "\"oportunidade\" (urgência)"],
  [/\b(ultimas? unidades?|corre|aproveite|nao perca|garanta|so hoje|por tempo limitado|urgente)\b/, "urgência falsa"],
  [/\b(desconto|negociavel|aceita proposta|abaixo do mercado|preco de ocasiao)\b/, "promessa de desconto ou negociação"],
  [/\b(sem filhos|gente bonita|gente fina|so para|apenas para (casais|homens|mulheres))\b/, "termo que exclui pessoas"],
];

const EMOJI = /\p{Extended_Pictographic}/u;

/** Motivos pelos quais o texto viola as regras de voz. Lista vazia = ok. */
export function problemasDeVoz(texto: string): string[] {
  const motivos: string[] = [];
  const s = sem(texto);
  for (const [re, motivo] of PROIBIDAS) if (re.test(s)) motivos.push(motivo);
  if (EMOJI.test(texto)) motivos.push("emoji");
  if ((texto.match(/!/g) ?? []).length > 1 || /!!/.test(texto)) motivos.push("exclamação em excesso");
  // Caixa alta em frase inteira (siglas curtas como FGTS e CRECI passam).
  const palavras = texto.match(/\p{L}{4,}/gu) ?? [];
  if (palavras.length >= 2 && palavras.every((p) => p === p.toUpperCase())) motivos.push("frase em caixa alta");
  return motivos;
}
