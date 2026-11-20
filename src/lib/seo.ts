export function urlDoSite(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function urlDoImovel(slug: string): string {
  return `${urlDoSite()}/imovel/${slug}`;
}

/** URL absoluta: foto do Appwrite ou do Unsplash já é; as locais (`/mock-uploads/...`) ganham o domínio. */
function absoluta(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${urlDoSite()}${url.startsWith("/") ? "" : "/"}${url}`;
}

type DadosJsonLd = {
  slug: string;
  titulo: string;
  descricao: string;
  bairro: string;
  cidade: string;
  endereco: string | null;
  mostrarEndereco: boolean;
  latitude: number | null;
  longitude: number | null;
  preco: number;
  status: "publicado" | "vendido";
  fotos: { src: string }[];
};

/**
 * JSON-LD da página do imóvel (RF-26): RealEstateListing com Offer e Place.
 * RN-05: endereço completo e coordenadas só entram se o corretor marcou "mostrar endereço";
 * senão só bairro e cidade.
 */
export function jsonLdImovel(i: DadosJsonLd) {
  const exato = i.mostrarEndereco && i.endereco;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: i.titulo,
    description: i.descricao.replace(/\s+/g, " ").trim(),
    url: urlDoImovel(i.slug),
    image: i.fotos.map((f) => absoluta(f.src)),
    offers: {
      "@type": "Offer",
      price: i.preco,
      priceCurrency: "BRL",
      availability: i.status === "vendido" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: urlDoImovel(i.slug),
    },
    contentLocation: {
      "@type": "Place",
      name: `${i.bairro}, ${i.cidade}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: i.cidade,
        addressCountry: "BR",
        ...(exato ? { streetAddress: i.endereco } : {}),
      },
      ...(exato && i.latitude !== null && i.longitude !== null
        ? { geo: { "@type": "GeoCoordinates", latitude: i.latitude, longitude: i.longitude } }
        : {}),
    },
  };
}

/**
 * JSON-LD da página inicial: a organização, o site e o serviço. Sem FAQPage (o Google aposentou o
 * resultado enriquecido) e sem preço, porque o piloto não cobra.
 */
export function jsonLdSite(descricao: string) {
  const url = urlDoSite();
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${url}/#organizacao`, name: "Showing", url, description: descricao, areaServed: { "@type": "City", name: "Blumenau" } },
      { "@type": "WebSite", "@id": `${url}/#site`, url, name: "Showing", inLanguage: "pt-BR", publisher: { "@id": `${url}/#organizacao` } },
      {
        "@type": "SoftwareApplication",
        name: "Showing",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: descricao,
        inLanguage: "pt-BR",
        url,
        provider: { "@id": `${url}/#organizacao` },
      },
    ],
  };
}

/** Serializa o JSON-LD para dentro de um <script>: o caractere menor-que é escapado, então nenhum título fecha a tag. */
export function serializarJsonLd(dados: object): string {
  return JSON.stringify(dados)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}
