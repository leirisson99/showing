import { z } from "zod";

// Mesmo schema no formulário (cliente) e na Server Action (servidor).
export const MENSAGEM_EMAIL_INVALIDO = "Digite um e-mail válido, como nome@exemplo.com.br.";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email(MENSAGEM_EMAIL_INVALIDO)),
});
