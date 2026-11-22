import { z } from "zod";

// Mesmo schema no formulário (cliente) e na Server Action (servidor).
export const MENSAGEM_EMAIL_INVALIDO = "Digite um e-mail válido, como nome@exemplo.com.br.";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email(MENSAGEM_EMAIL_INVALIDO)),
});

export const cadastroSchema = z.object({
  nome: z.string().trim().min(3, "Digite seu nome completo.").max(120, "O nome está muito longo."),
  email: loginSchema.shape.email,
  // CRECI é opcional no cadastro; o corretor completa depois no perfil.
  creci: z.string().trim().max(40, "O CRECI está muito longo.").optional(),
  codigo: z.string().trim().max(80).optional(),
  aceite: z.literal("on", "Aceite a política de privacidade para continuar."),
});
