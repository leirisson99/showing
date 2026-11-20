import { PERGUNTA_FINAL, perguntasValidas } from "./catalogo";
import { numeroDoCampo, valorDoCampo, type EntradaRoteiro } from "./entrada";
import { FOTOS_PARA_FAMILIA, type Capitulo, type Roteiro } from "./roteiro";
import { TIPOS } from "@/lib/painel/schema";

// Roteiro montado só por código, com os dados da ficha. Serve de reserva quando a IA não está
// configurada e de ponto de partida nos testes: por construção passa pelo validador.

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const corta = (t: string, max: number) => (t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`);

const ROTULO_NUMERO: Record<string, (n: number) => string> = {
  "imovel.quartos": (n) => (n === 1 ? "quarto" : "quartos"),
  "imovel.areaM2": () => "m²",
  "imovel.vagas": (n) => (n === 1 ? "vaga" : "vagas"),
  "imovel.banheiros": (n) => (n === 1 ? "banheiro" : "banheiros"),
  "imovel.suites": (n) => (n === 1 ? "suíte" : "suítes"),
};

export function escolherTemplate(e: EntradaRoteiro): { template: Roteiro["template"]; motivo: string } {
  const { quartos, tipo } = e.imovel;
  if (e.fotos.length < FOTOS_PARA_FAMILIA) {
    return { template: "essencial", motivo: `Com ${plural(e.fotos.length, "foto", "fotos")}, o template essencial mostra todas sem deixar capítulo vazio.` };
  }
  if (quartos >= 3 && (tipo === "casa" || tipo === "apartamento")) {
    return { template: "familia", motivo: `${TIPOS[tipo]} com ${quartos} quartos e ${e.fotos.length} fotos: espaço para ambientes e galeria.` };
  }
  return { template: "essencial", motivo: "Imóvel pequeno ou sem tantos ambientes: o essencial conta a história sem enrolar." };
}

export function roteiroPadrao(e: EntradaRoteiro): Roteiro {
  const i = e.imovel;
  const { template, motivo } = escolherTemplate(e);
  const tipo = TIPOS[i.tipo];
  const comodos = i.tipo === "terreno" || i.tipo === "sala_comercial" || i.quartos === 0 ? null : plural(i.quartos, "quarto", "quartos");

  const capa = e.fotos[0];
  const resto = e.fotos.slice(1);
  const capitulos: Capitulo[] = [];

  capitulos.push({
    tipo: "hero_imagem",
    titulo: {
      texto: `${tipo}${comodos ? ` de ${comodos}` : ""} no ${i.bairro}`,
      fontes: [{ campo: "imovel.tipo" }, ...(comodos ? [{ campo: "imovel.quartos" }] : []), { campo: "imovel.bairro" }],
    },
    foto: capa.id,
    movimento: "suave",
  });

  const campos = ["imovel.quartos", "imovel.areaM2", "imovel.vagas", "imovel.banheiros", "imovel.suites"].filter((c) => numeroDoCampo(e, c) !== null).slice(0, 3);
  if (campos.length === 3) {
    capitulos.push({
      tipo: "numeros",
      titulo: { texto: "O imóvel em números.", fontes: campos.map((campo) => ({ campo })) },
      itens: campos.map((campo) => ({ campo, rotulo: ROTULO_NUMERO[campo](numeroDoCampo(e, campo)!) })),
      movimento: "suave",
    });
  }

  if (template === "familia") {
    const quadros = resto.slice(0, 3).map((f, k) => {
      const carac = i.caracteristicas[k];
      return {
        foto: f.id,
        rotulo: corta(f.legenda?.trim() || `Ambiente ${k + 1}`, 24),
        frase: f.legenda?.trim()
          ? { texto: corta(`${f.legenda.trim().replace(/[.!]+$/, "")}.`, 140), fontes: [{ campo: `foto:${f.id}` }] }
          : carac
            ? { texto: corta(`${carac.replace(/[.!]+$/, "")}.`, 140), fontes: [{ campo: `imovel.caracteristicas[${k}]` }] }
            : { texto: "Mais um ângulo do imóvel.", fontes: [{ campo: `foto:${f.id}` }] },
      };
    });
    capitulos.push({ tipo: "ambientes_fixo", quadros, movimento: "suave" });
    // Galeria: as fotos que sobraram e, se faltar, a capa (a única que pode repetir).
    const galeria = [...resto.slice(3), capa].slice(0, 12);
    capitulos.push({ tipo: "galeria_horizontal", titulo: { texto: "Cada canto, em detalhe.", fontes: [{ campo: "fotos" }] }, fotos: galeria.map((f) => f.id), movimento: "suave" });
  } else {
    capitulos.push({ tipo: "galeria_grade", titulo: { texto: "Veja o imóvel por dentro.", fontes: [{ campo: "fotos" }] }, fotos: e.fotos.slice(0, 12).map((f) => f.id), movimento: "suave" });
  }

  const temInfo = ["escolas", "mercados", "saude", "distanciaCentro"].some((c) => valorDoCampo(e, `imovel.infoBairro.${c}`) !== undefined);
  capitulos.push({
    tipo: "bairro",
    titulo: temInfo
      ? { texto: "O que tem por perto.", fontes: ["escolas", "mercados", "saude", "distanciaCentro"].filter((c) => valorDoCampo(e, `imovel.infoBairro.${c}`) !== undefined).map((c) => ({ campo: `imovel.infoBairro.${c}` })) }
      : { texto: `No ${i.bairro}, em ${i.cidade}.`, fontes: [{ campo: "imovel.bairro" }, { campo: "imovel.cidade" }] },
    movimento: "suave",
  });

  const validas = perguntasValidas(e).filter((p) => p.pergunta !== PERGUNTA_FINAL).slice(0, 4);
  const perguntas = [...validas.map((p) => ({ tema: p.tema, pergunta: p.pergunta })), { tema: "Visita", pergunta: PERGUNTA_FINAL }].map((p, k) => ({
    rotulo: `${String(k + 1).padStart(2, "0")} / ${p.tema}`,
    pergunta: p.pergunta,
  }));
  capitulos.push({ tipo: "duvidas", titulo: { texto: "Ficou alguma dúvida? Pergunte agora.", fontes: [{ campo: "sistema" }] }, perguntas, movimento: "suave" });
  capitulos.push({ tipo: "cta_visita", titulo: { texto: "Que tal ver de perto?", fontes: [{ campo: "sistema" }] }, movimento: "suave" });

  const titulo = corta(`${tipo}${comodos ? ` ${i.quartos} ${i.quartos === 1 ? "quarto" : "quartos"}` : ""} no ${i.bairro}, ${i.cidade}`, 60);
  const fatos = [comodos, `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(i.areaM2)} m²`].filter(Boolean).join(" e ");
  return {
    versao: 1,
    template,
    motivoTemplate: corta(motivo, 200),
    persona: template === "familia" ? "familia" : "geral",
    seo: { title: titulo, description: corta(`${tipo} no ${i.bairro}, em ${i.cidade}, com ${fatos}. Tire dúvidas e agende sua visita com o corretor.`, 155) },
    capitulos,
    alertas: alertasDaFicha(e),
  };
}

/** Dados que o corretor não preencheu e o que isso muda na página (spec: campos faltando não viram texto). */
export function alertasDaFicha(e: EntradaRoteiro): string[] {
  const i = e.imovel;
  const a: string[] = [];
  if (i.condominio === null) a.push("Condomínio não preenchido: não aparece na página e o assistente não responde sobre ele.");
  if (i.iptu === null) a.push("IPTU não preenchido: não aparece na página e o assistente não responde sobre ele.");
  if (i.aceitaFgts === null) a.push("FGTS não informado: a página não fala de FGTS.");
  if (!i.infoBairro) a.push("Informações do bairro não preenchidas: o capítulo do bairro mostra só o nome do bairro e da cidade.");
  if (i.caracteristicas.length === 0) a.push("Nenhuma característica cadastrada: os textos usam só números e legendas.");
  const semLegenda = e.fotos.filter((f) => !f.legenda?.trim()).length;
  if (semLegenda > 0) a.push(`${plural(semLegenda, "foto sem legenda", "fotos sem legenda")}: o texto de cada ambiente fica genérico. Legende as fotos para melhorar.`);
  return a;
}
