import { z } from "zod";

// Roteiro da página do imóvel (docs/agent-diretor-pagina.md). O agente devolve este JSON; quem desenha
// a página é o front-end. Fase 1: templates `familia` e `essencial`, fotos originais, sem vídeo.

export const MOVIMENTOS = ["suave", "marcante", "minimo"] as const;
const Movimento = z.enum(MOVIMENTOS).default("suave");

/** Toda frase aponta para o campo da ficha (ou foto) que a sustenta. `sistema`: texto que não afirma nada do imóvel. */
const Fonte = z.object({ campo: z.string().min(1) });
export const Texto = z.object({
  texto: z.string().trim().min(1).max(140),
  fontes: z.array(Fonte).min(1),
});

/** Nomes do lucide-react permitidos nos cartões (lista fechada, para nada quebrar na tela). */
export const ICONES = ["Home", "Trees", "Sofa", "BedDouble", "Bath", "Car", "Ruler", "Sun", "ShieldCheck", "Wifi", "Dumbbell", "PawPrint", "Flame", "Waves", "Building2", "MapPin"] as const;

export const Capitulo = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("hero_imagem"), titulo: Texto, foto: z.string(), movimento: Movimento }),
  z.object({
    tipo: z.literal("numeros"),
    titulo: Texto,
    itens: z.array(z.object({ campo: z.string(), rotulo: z.string().trim().min(1).max(24) })).length(3),
    movimento: Movimento,
  }),
  z.object({
    tipo: z.literal("ambientes_fixo"),
    quadros: z.array(z.object({ foto: z.string(), rotulo: z.string().trim().min(1).max(24), frase: Texto })).min(3).max(5),
    movimento: Movimento,
  }),
  z.object({ tipo: z.literal("galeria_horizontal"), titulo: Texto, fotos: z.array(z.string()).min(5).max(12), movimento: Movimento }),
  z.object({ tipo: z.literal("galeria_grade"), titulo: Texto, fotos: z.array(z.string()).min(3).max(12), movimento: Movimento }),
  z.object({ tipo: z.literal("bairro"), titulo: Texto, movimento: Movimento }),
  z.object({
    tipo: z.literal("duvidas"),
    titulo: Texto,
    perguntas: z.array(z.object({ rotulo: z.string().trim().min(1).max(40), pergunta: z.string().trim().min(1).max(80) })).min(3).max(6),
    movimento: Movimento,
  }),
  z.object({ tipo: z.literal("cta_visita"), titulo: Texto, movimento: Movimento }),
]);

export const TEMPLATES = ["familia", "essencial"] as const;
export const PERSONAS = ["familia", "casal", "investidor", "primeiro_imovel", "geral"] as const;

export const Roteiro = z.object({
  versao: z.literal(1),
  template: z.enum(TEMPLATES),
  motivoTemplate: z.string().trim().min(1).max(200),
  persona: z.enum(PERSONAS),
  seo: z.object({ title: z.string().trim().min(1).max(60), description: z.string().trim().min(1).max(155) }),
  capitulos: z.array(Capitulo).min(5).max(9),
  alertas: z.array(z.string()),
});

export type Roteiro = z.infer<typeof Roteiro>;
export type Capitulo = z.infer<typeof Capitulo>;
export type TipoCapitulo = Capitulo["tipo"];
export type Template = (typeof TEMPLATES)[number];

/** Sequência de cada template. `obrigatorios` ficam sempre; o resto o agente pode tirar e reordenar (só os do meio). */
export const SEQUENCIA: Record<Template, TipoCapitulo[]> = {
  familia: ["hero_imagem", "numeros", "ambientes_fixo", "galeria_horizontal", "bairro", "duvidas", "cta_visita"],
  essencial: ["hero_imagem", "numeros", "galeria_grade", "bairro", "duvidas", "cta_visita"],
};
export const OBRIGATORIOS: TipoCapitulo[] = ["hero_imagem", "duvidas", "cta_visita"];

/** Fotos distintas que o template `familia` precisa (3 ambientes + 5 na galeria; a capa pode repetir). */
export const FOTOS_PARA_FAMILIA = 8;
