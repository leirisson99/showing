import { PERGUNTA_FINAL, perguntaDoCatalogo } from "./catalogo";
import { numeroDoCampo, valorDoCampo, type EntradaRoteiro } from "./entrada";
import { problemasDeVoz } from "./palavras";
import { FOTOS_PARA_FAMILIA, OBRIGATORIOS, Roteiro, SEQUENCIA, type Capitulo } from "./roteiro";

// Segundo filtro do Diretor da Página (docs/agent-diretor-pagina.md, "Validação"): o que o schema não pega.
// Erros em português, escritos para o agente reescrever. Vale para o que ele gera e para o que o corretor edita.

export type ResultadoValidacao = { ok: true; roteiro: Roteiro } | { ok: false; erros: string[] };

type TextoComFonte = { texto: string; fontes: { campo: string }[] };

const palavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const sem = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function textosDe(c: Capitulo): { onde: string; t: TextoComFonte; titulo: boolean; sistema: boolean }[] {
  const nome = c.tipo;
  switch (c.tipo) {
    case "ambientes_fixo":
      return c.quadros.map((q, i) => ({ onde: `${nome} quadro ${i + 1}`, t: q.frase, titulo: false, sistema: false }));
    case "duvidas":
    case "cta_visita":
      return [{ onde: `${nome} título`, t: c.titulo, titulo: true, sistema: true }];
    default:
      return [{ onde: `${nome} título`, t: c.titulo, titulo: true, sistema: false }];
  }
}

function fotosDe(c: Capitulo): string[] {
  switch (c.tipo) {
    case "hero_imagem":
      return [c.foto];
    case "ambientes_fixo":
      return c.quadros.map((q) => q.foto);
    case "galeria_horizontal":
    case "galeria_grade":
      return c.fotos;
    default:
      return [];
  }
}

/** Palavras do endereço que não podem aparecer quando o corretor não liberou (RN-05). */
function trechosDoEndereco(e: EntradaRoteiro): string[] {
  if (e.imovel.mostrarEndereco || !e.imovel.endereco) return [];
  return sem(e.imovel.endereco).split(/[^a-z0-9]+/).filter((p) => p.length >= 4 && !/^(rua|avenida|alameda|travessa|bairro|casa|apto|apartamento)$/.test(p));
}

/** Números que podem aparecer nos textos: os da ficha. Qualquer outro é invenção. */
function numerosDaFicha(e: EntradaRoteiro): Set<string> {
  const i = e.imovel;
  const fonte = [i.quartos, i.suites, i.banheiros, i.vagas, i.areaM2, i.condominio, i.iptu, i.preco, ...i.caracteristicas, i.infoAdicional ?? "", i.bairro, i.cidade];
  const infoBairro = i.infoBairro ? [...i.infoBairro.escolas, ...i.infoBairro.mercados, ...i.infoBairro.saude, i.infoBairro.distanciaCentro] : [];
  const legendas = e.fotos.map((f) => f.legenda ?? ""); // o que o corretor escreveu na legenda também é dado cadastrado
  return new Set([...fonte, ...infoBairro, ...legendas].flatMap((v) => String(v ?? "").match(/\d+/g) ?? []));
}

type Opcoes = {
  /** Texto editado pelo corretor: não precisa de fonte nem de checagem de números (ele responde pelo que escreve). */
  editado?: boolean;
};

export function validarRoteiro(bruto: unknown, e: EntradaRoteiro, opcoes: Opcoes = {}): ResultadoValidacao {
  const lido = Roteiro.safeParse(bruto);
  if (!lido.success) {
    return { ok: false, erros: lido.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "roteiro"}: ${i.message}`) };
  }
  const r = lido.data;
  const erros: string[] = [];
  const ids = new Set(e.fotos.map((f) => f.id));

  // --- Estrutura ---
  const tipos = r.capitulos.map((c) => c.tipo);
  if (tipos[0] !== "hero_imagem") erros.push("O primeiro capítulo precisa ser o hero_imagem.");
  if (tipos.at(-2) !== "duvidas" || tipos.at(-1) !== "cta_visita") erros.push("Os dois últimos capítulos precisam ser duvidas e cta_visita, nessa ordem.");
  for (const t of OBRIGATORIOS) if (!tipos.includes(t)) erros.push(`Falta o capítulo obrigatório ${t}.`);

  const sequencia = SEQUENCIA[r.template];
  const extras = tipos.filter((t) => !sequencia.includes(t));
  if (extras.length) erros.push(`O template ${r.template} não tem o capítulo ${[...new Set(extras)].join(", ")}.`);
  if (new Set(tipos).size !== tipos.length) erros.push("Cada tipo de capítulo aparece uma vez só.");
  // Só os do meio mudam de ordem: o que está depois de hero e antes de duvidas/cta.
  const meio = tipos.slice(1, -2);
  if (meio.some((t) => OBRIGATORIOS.includes(t))) erros.push("hero, duvidas e cta_visita não podem ficar no meio da página.");

  // --- Fotos ---
  if (r.template === "familia" && e.fotos.length < FOTOS_PARA_FAMILIA) {
    erros.push(`Com ${e.fotos.length} fotos, o template é essencial: o familia precisa de pelo menos ${FOTOS_PARA_FAMILIA} fotos diferentes.`);
  }
  const capa = r.capitulos[0]?.tipo === "hero_imagem" ? r.capitulos[0].foto : null;
  const vistas = new Set<string>();
  r.capitulos.forEach((c, k) => {
    for (const f of fotosDe(c)) {
      if (!ids.has(f)) erros.push(`A foto ${f} não existe neste imóvel.`);
      else if (vistas.has(f) && f !== capa) erros.push(`A foto ${f} aparece em mais de um capítulo (só a capa pode repetir).`);
      if (!(k === 0 && f === capa)) vistas.add(f);
    }
  });
  for (const c of r.capitulos) {
    if (c.tipo === "galeria_horizontal" || c.tipo === "galeria_grade") {
      if (new Set(c.fotos).size !== c.fotos.length) erros.push(`${c.tipo} repete uma foto.`);
    }
  }

  // --- Textos ---
  const numeros = numerosDaFicha(e);
  const endereco = trechosDoEndereco(e);
  for (const c of r.capitulos) {
    for (const { onde, t, titulo, sistema } of textosDe(c)) {
      if (titulo && palavras(t.texto) > 9) erros.push(`${onde}: o título tem ${palavras(t.texto)} palavras; o máximo é 9.`);
      for (const motivo of problemasDeVoz(t.texto)) erros.push(`${onde}: "${t.texto}" usa ${motivo}.`);
      const s = sem(t.texto);
      if (endereco.some((p) => s.includes(p))) erros.push(`${onde}: cita o endereço, que o corretor não liberou.`);
      if (opcoes.editado) continue;
      for (const f of t.fontes) {
        if (f.campo === "sistema" && !sistema) erros.push(`${onde}: "sistema" só vale para os títulos de duvidas e cta_visita.`);
        else if (valorDoCampo(e, f.campo) === undefined) erros.push(`${onde}: a fonte "${f.campo}" não existe ou não está preenchida.`);
      }
      if (!sistema && !/^[^\d]*$/.test(t.texto)) {
        const invent = (t.texto.match(/\d+/g) ?? []).filter((n) => !numeros.has(n));
        if (invent.length) erros.push(`${onde}: o número ${invent[0]} não está na ficha.`);
      }
    }
  }

  // --- Capítulos específicos ---
  for (const c of r.capitulos) {
    if (c.tipo === "numeros") {
      for (const item of c.itens) if (numeroDoCampo(e, item.campo) === null) erros.push(`numeros: "${item.campo}" não é um número preenchido na ficha.`);
      if (new Set(c.itens.map((i) => i.campo)).size !== 3) erros.push("numeros: os 3 itens precisam ser campos diferentes.");
    }
    if (c.tipo === "duvidas") {
      c.perguntas.forEach((p, i) => {
        const cat = perguntaDoCatalogo(p.pergunta);
        if (!cat) erros.push(`duvidas: "${p.pergunta}" não é uma pergunta que o atendente responda com a ficha.`);
        else if (!cat.vale(e)) erros.push(`duvidas: "${p.pergunta}" depende de um campo que não está preenchido.`);
        const esperado = `${String(i + 1).padStart(2, "0")} / `;
        if (!p.rotulo.startsWith(esperado)) erros.push(`duvidas: o rótulo "${p.rotulo}" deve começar com "${esperado}" (formato NN / Tema).`);
      });
      if (sem(c.perguntas.at(-1)?.pergunta ?? "") !== sem(PERGUNTA_FINAL)) erros.push(`duvidas: a última pergunta é sempre "${PERGUNTA_FINAL}".`);
    }
  }

  // --- SEO ---
  if (r.seo.title.length > 60) erros.push("seo.title passa de 60 caracteres.");
  if (r.seo.description.length > 155) erros.push("seo.description passa de 155 caracteres.");
  for (const [campo, t] of [["seo.title", r.seo.title], ["seo.description", r.seo.description]] as const) {
    for (const motivo of problemasDeVoz(t)) erros.push(`${campo}: usa ${motivo}.`);
    if (!opcoes.editado) {
      const invent = (t.match(/\d+/g) ?? []).filter((n) => !numeros.has(n));
      if (invent.length) erros.push(`${campo}: o número ${invent[0]} não está na ficha.`);
    }
    if (endereco.some((p) => sem(t).includes(p))) erros.push(`${campo}: cita o endereço, que o corretor não liberou.`);
  }

  return erros.length > 0 ? { ok: false, erros: [...new Set(erros)].slice(0, 15) } : { ok: true, roteiro: r };
}
