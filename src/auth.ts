import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { usarMocks } from "@/lib/mocks";
import { linkDeConfirmacao } from "@/lib/link-acesso";
import { urlDoSite } from "@/lib/seo";
import { LinkDeAcesso } from "@/emails/link-de-acesso";

const MINUTOS_DE_VALIDADE = 15;

// Provider de e-mail próprio: o envio passa por src/lib/email.ts (EMAIL_*, Gmail).
const linkMagico: EmailConfig = {
  id: "email",
  type: "email",
  name: "E-mail",
  maxAge: MINUTOS_DE_VALIDADE * 60,
  async sendVerificationRequest({ identifier, url }) {
    // O e-mail leva à tela de confirmação (botão), não ao link que consome o token: leitores de
    // e-mail com verificação de links gastariam o token antes do clique. O domínio vem de
    // NEXT_PUBLIC_SITE_URL, não do cabeçalho da requisição.
    const link = linkDeConfirmacao(url, urlDoSite());

    await enviarEmail({
      para: identifier,
      assunto: "Seu link de acesso ao Showing",
      template: LinkDeAcesso({ link }),
    });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // O app roda atrás de um proxy (Easypanel, Caddy, Nginx): o host vem do cabeçalho dele. O link do e-mail usa
  // sempre NEXT_PUBLIC_SITE_URL, então confiar no host aqui não muda para onde o link aponta.
  trustHost: true,
  providers: [linkMagico],
  // JWT: o proxy confere a sessão sem consultar o banco.
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login/verificar", error: "/login" },
  callbacks: {
    // Na POC só os corretores já cadastrados entram.
    async signIn({ user }) {
      if (!user.email) return false;
      const corretor = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      return corretor !== null;
    },
    // Com JWT o id do corretor não vai para a sessão sozinho: sem ele `exigirCorretor` não acha
    // o usuário e manda de volta ao login (laço depois do link mágico).
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    authorized({ auth, request }) {
      if (usarMocks()) return true;
      if (request.nextUrl.pathname.startsWith("/painel")) return !!auth?.user;
      return true;
    },
  },
});
