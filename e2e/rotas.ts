import type { Page } from "@playwright/test";

export const SLUG_PUBLICADO = "apartamento-2-quartos-victor-konder-blumenau";
export const SLUG_VENDIDO = "casa-3-quartos-itoupava-norte-blumenau";

export type Rota = { nome: string; caminho: string };

export const ROTAS_PUBLICAS: Rota[] = [
  { nome: "home", caminho: "/" },
  { nome: "imovel", caminho: `/imovel/${SLUG_PUBLICADO}` },
  { nome: "imovel-vendido", caminho: `/imovel/${SLUG_VENDIDO}` },
  { nome: "login", caminho: "/login" },
  { nome: "cadastro", caminho: "/cadastro" },
  { nome: "login-verificar", caminho: "/login/verificar?email=corretor@exemplo.com" },
  { nome: "privacidade", caminho: "/privacidade" },
];

export const ROTAS_PAINEL: Rota[] = [
  { nome: "painel", caminho: "/painel" },
  { nome: "painel-imoveis", caminho: "/painel/imoveis" },
  { nome: "painel-imoveis-novo", caminho: "/painel/imoveis/novo" },
  { nome: "painel-imoveis-editar", caminho: "/painel/imoveis/mock-1" },
  { nome: "painel-imoveis-previa", caminho: "/painel/imoveis/mock-1/previa" },
  { nome: "painel-visitas", caminho: "/painel/visitas" },
  { nome: "painel-conversas", caminho: "/painel/conversas" },
  { nome: "painel-clientes", caminho: "/painel/clientes" },
  { nome: "painel-perfil", caminho: "/painel/perfil" },
];

/** Rotas que dependem de ids gerados (conversa e cliente de exemplo): descobertas pela lista. */
export async function rotasComId(page: Page): Promise<Rota[]> {
  const achar = async (lista: string, prefixo: string, nome: string): Promise<Rota[]> => {
    await page.goto(lista);
    const href = await page.locator(`a[href^="${prefixo}/"]`).first().getAttribute("href");
    return href ? [{ nome, caminho: href }] : [];
  };
  return [
    ...(await achar("/painel/conversas", "/painel/conversas", "painel-conversa")),
    ...(await achar("/painel/clientes", "/painel/clientes", "painel-cliente")),
  ];
}

export const TODAS_AS_ROTAS = [...ROTAS_PUBLICAS, ...ROTAS_PAINEL];
