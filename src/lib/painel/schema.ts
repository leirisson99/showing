import { z } from "zod";

// Mesmo schema no formulário (cliente) e na Server Action (servidor).
// Sem transform: os campos numéricos chegam já convertidos (ver FormImovel).

export const TIPOS = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
  sala_comercial: "Sala comercial",
} as const;

export const FINALIDADES = { venda: "Venda", aluguel: "Aluguel" } as const;

const numero = (msg: string) => z.number({ error: msg });
const inteiro = (msg: string) => numero(msg).int("Use um número inteiro").min(0, "Não pode ser negativo");

export const imovelSchema = z.object({
  tipo: z.enum(["apartamento", "casa", "terreno", "sala_comercial"], { error: "Escolha o tipo" }),
  finalidade: z.enum(["venda", "aluguel"], { error: "Escolha a finalidade" }),
  titulo: z.string().trim().min(5, "Mínimo de 5 caracteres").max(120, "Máximo de 120 caracteres"),
  descricao: z.string().trim().min(20, "Mínimo de 20 caracteres").max(5000, "Máximo de 5000 caracteres"),
  bairro: z.string().trim().min(2, "Informe o bairro").max(80),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  endereco: z.string().trim().max(200).nullable(),
  mostrarEndereco: z.boolean(),
  latitude: z.number({ error: "Informe um número" }).min(-90, "Entre -90 e 90").max(90, "Entre -90 e 90").nullable(),
  longitude: z.number({ error: "Informe um número" }).min(-180, "Entre -180 e 180").max(180, "Entre -180 e 180").nullable(),
  preco: numero("Informe o preço").positive("O preço deve ser maior que zero"),
  condominio: numero("Informe um número").min(0, "Não pode ser negativo").nullable(),
  iptu: numero("Informe um número").min(0, "Não pode ser negativo").nullable(),
  quartos: inteiro("Informe os quartos"),
  suites: inteiro("Informe um número").nullable(),
  banheiros: inteiro("Informe os banheiros"),
  vagas: inteiro("Informe as vagas"),
  areaM2: numero("Informe a área").positive("A área deve ser maior que zero"),
  aceitaFinanciamento: z.boolean(),
  aceitaFgts: z.boolean(),
  caracteristicas: z.array(z.string().trim().min(1).max(60)).max(30, "Máximo de 30 características"),
  infoAdicional: z.string().trim().max(2000, "Máximo de 2000 caracteres").nullable(),
});

export type DadosImovel = z.infer<typeof imovelSchema>;

/** Primeiro passo do cadastro: tudo, menos o texto e as características. */
export const etapaDadosSchema = imovelSchema.omit({ titulo: true, descricao: true, caracteristicas: true, infoAdicional: true });
export type DadosIniciais = z.infer<typeof etapaDadosSchema>;

export const CARACTERISTICAS_COMUNS = [
  "Sacada com churrasqueira",
  "Armários embutidos",
  "Elevador",
  "Portaria",
  "Salão de festas",
  "Piscina",
  "Mobiliado",
  "Pátio",
  "Aceita pets",
  "Ar-condicionado",
];

export const FOTOS_MINIMAS = 3;
export const FOTO_MAX_BYTES = 10 * 1024 * 1024;
export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;
