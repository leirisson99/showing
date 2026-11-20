import { z } from "zod";
import type { DiaSemana } from "@/lib/ai/horarios";

// Mesmo schema no formulário (cliente) e na Server Action (servidor).

export const DIAS_DA_SEMANA: { chave: DiaSemana; rotulo: string }[] = [
  { chave: "dom", rotulo: "Domingo" },
  { chave: "seg", rotulo: "Segunda-feira" },
  { chave: "ter", rotulo: "Terça-feira" },
  { chave: "qua", rotulo: "Quarta-feira" },
  { chave: "qui", rotulo: "Quinta-feira" },
  { chave: "sex", rotulo: "Sexta-feira" },
  { chave: "sab", rotulo: "Sábado" },
];

export const DURACOES_VISITA = [30, 45, 60, 90, 120] as const;
export const MAX_HORARIOS_POR_DIA = 12;

const horario = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM, por exemplo 09:30");

const dia = z
  .array(horario)
  .max(MAX_HORARIOS_POR_DIA, `No máximo ${MAX_HORARIOS_POR_DIA} horários por dia`)
  .refine((v) => new Set(v).size === v.length, "Há horários repetidos no mesmo dia");

const telefone = z
  .string()
  .trim()
  .refine((v) => v === "" || (v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 13), "WhatsApp inválido. Use DDD + número.");

export const perfilSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100, "Máximo de 100 caracteres"),
  creci: z.string().trim().min(3, "Informe o CRECI").max(30, "Máximo de 30 caracteres"),
  whatsapp: telefone,
  horariosVisita: z.object({
    dom: dia.optional(),
    seg: dia.optional(),
    ter: dia.optional(),
    qua: dia.optional(),
    qui: dia.optional(),
    sex: dia.optional(),
    sab: dia.optional(),
  }),
  duracaoVisitaMin: z
    .number({ error: "Escolha a duração" })
    .refine((v) => (DURACOES_VISITA as readonly number[]).includes(v), "Escolha uma das durações"),
});

export type DadosPerfil = z.infer<typeof perfilSchema>;
