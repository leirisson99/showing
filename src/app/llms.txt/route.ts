import { listarSlugsIndexaveis } from "@/lib/imoveis";
import { urlDoImovel, urlDoSite } from "@/lib/seo";

// llms.txt (RF-27): resumo do site e das páginas públicas, em texto simples, para agentes de IA.
export async function GET() {
  const slugs = await listarSlugsIndexaveis();
  const linhas = [
    "# Showing",
    "",
    "> Página exclusiva para cada imóvel, com um atendente virtual que tira dúvidas do comprador com os dados do anúncio e ajuda a agendar a visita. Em teste com corretores de Blumenau.",
    "",
    "## Páginas",
    "",
    `- [Início](${urlDoSite()}/): o que é o Showing e como funciona`,
    `- [Política de privacidade](${urlDoSite()}/privacidade): que dados o atendente coleta e como pedir a exclusão`,
    "",
    "## Imóveis publicados",
    "",
    ...(slugs.length > 0 ? slugs.map((s) => `- [${s}](${urlDoImovel(s)})`) : ["- Nenhum imóvel publicado no momento."]),
    "",
  ];
  return new Response(linhas.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
