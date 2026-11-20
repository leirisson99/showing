// Fotos de exemplo do Unsplash (Unsplash License: uso livre, crédito não é obrigatório,
// mas está aqui e em docs/creditos-imagens.md). Só para desenvolvimento: em produção as
// fotos do imóvel vêm do Appwrite. O host precisa estar em `images.remotePatterns`.

export type FotoUnsplash = { id: string; alt: string; legenda: string; autor: string; perfil: string };

export const UNSPLASH = {
  fachada: { legenda: "Fachada", id: "photo-1755735340764-3b077cab0c5c", alt: "Fachada de um prédio de apartamentos com varandas", autor: "Anton Ryazanov", perfil: "@antonioxyz" },
  sala: { legenda: "Sala de estar", id: "photo-1751945965597-71171ec7a458", alt: "Sala de estar com sofá, poltrona e janelas amplas", autor: "Nha Chill", perfil: "@nhachill" },
  cozinha: { legenda: "Cozinha", id: "photo-1768486143865-342d8cc12c90", alt: "Cozinha com ilha de madeira e luminárias pendentes", autor: "Clay Banks", perfil: "@claybanks" },
  quarto: { legenda: "Quarto", id: "photo-1668089677938-b52086753f77", alt: "Quarto com cama de casal, cômoda e janela com vista da cidade", autor: "Lotus Design N Print", perfil: "@lotusdnp" },
  varanda: { legenda: "Varanda", id: "photo-1722349672541-50fcfb6e2670", alt: "Varanda envidraçada com mesa, cadeiras e vista da cidade", autor: "Lisa Anna", perfil: "@lisaanna195" },
  banheiro: { legenda: "Banheiro", id: "photo-1750036015902-c6f5ebca924e", alt: "Banheiro com bancada de mármore escuro, cuba de pedra e plantas", autor: "Ela De Pure", perfil: "@eladepure" },
  // Fachadas de casas (seção de exemplos da página inicial).
  casaModerna: { legenda: "Casa moderna", id: "photo-1758448756207-54505680d130", alt: "Casa moderna de pedra e concreto com janelas do chão ao teto e jardim com lago", autor: "Aalo Lens", perfil: "@aalolens" },
  casaCampo: { legenda: "Casa de campo", id: "photo-1662770120554-43a199b1788f", alt: "Casa de campo de madeira iluminada à noite, com deck e gramado", autor: "Josh Hild", perfil: "@joshhild" },
  casaTijolos: { legenda: "Casarão de tijolos", id: "photo-1679421609072-3fdb6ab7279a", alt: "Casarão de tijolos aparentes de dois andares com varanda branca", autor: "Roger Starnes Sr", perfil: "@rstar50" },
  casaVaranda: { legenda: "Casa com varanda", id: "photo-1714836982299-7a3b6930e2f5", alt: "Casa azul de dois andares com varanda, escada de entrada e jardim florido", autor: "Clay Banks", perfil: "@claybanks" },
} satisfies Record<string, FotoUnsplash>;

export const HOST_UNSPLASH = "images.unsplash.com";

export function urlUnsplash(id: string, largura = 1600): string {
  return `https://${HOST_UNSPLASH}/${id}?auto=format&fit=crop&w=${largura}&q=80`;
}
