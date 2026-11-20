import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { enviarEmail } from "@/lib/email";
import { usarMocks } from "@/lib/mocks";
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
    // O host do link vem de NEXT_PUBLIC_SITE_URL, não do cabeçalho da requisição.
    const origem = new URL(urlDoSite());
    const link = new URL(url);
    link.protocol = origem.protocol;
    link.host = origem.host;

    await enviarEmail({
      para: identifier,
      assunto: "Seu link de acesso ao Showing",
      template: LinkDeAcesso({ link: link.toString() }),
    });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
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
    authorized({ auth, request }) {
      if (usarMocks()) return true;
      if (request.nextUrl.pathname.startsWith("/painel")) return !!auth?.user;
      return true;
    },
  },
});
