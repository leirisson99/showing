import { auth } from "@/auth";

// Sem sessão, o callback `authorized` (src/auth.ts) redireciona para /login.
export default auth;

export const config = {
  matcher: ["/painel/:path*"],
};
