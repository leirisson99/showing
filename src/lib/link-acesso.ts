// Link do e-mail de acesso. O Auth.js gera um link que, ao ser aberto, já consome o token. Leitores
// de e-mail com verificação de links (Outlook/Hotmail, antivírus) abrem esse endereço sozinhos e
// gastam o token antes do corretor clicar. Por isso o e-mail aponta para /login/confirmar, uma página
// com um botão: só o clique no botão (POST) segue para o link de verdade.

function caminhoDe(destino: string | null | undefined): string {
  if (!destino) return "/painel";
  try {
    const u = new URL(destino, "http://base.local");
    // Só caminhos do próprio site, nunca outro domínio.
    return u.pathname.startsWith("/") && !u.pathname.startsWith("//") ? `${u.pathname}${u.search}` : "/painel";
  } catch {
    return "/painel";
  }
}

/** Link do e-mail: página de confirmação no domínio público, com o token e o e-mail. */
export function linkDeConfirmacao(urlDoAuthJs: string, siteUrl: string): string {
  const original = new URL(urlDoAuthJs);
  const link = new URL("/login/confirmar", siteUrl);
  for (const chave of ["token", "email"]) {
    const valor = original.searchParams.get(chave);
    if (valor) link.searchParams.set(chave, valor);
  }
  link.searchParams.set("callbackUrl", caminhoDe(original.searchParams.get("callbackUrl")));
  return link.toString();
}

/** Link de verdade do Auth.js (consome o token), montado no domínio público. */
export function urlDoCallback(dados: { token: string; email: string; callbackUrl?: string | null }, siteUrl: string): string {
  const origem = new URL(siteUrl);
  const url = new URL("/api/auth/callback/email", origem);
  url.searchParams.set("callbackUrl", `${origem.origin}${caminhoDe(dados.callbackUrl)}`);
  url.searchParams.set("token", dados.token);
  url.searchParams.set("email", dados.email);
  return url.toString();
}
