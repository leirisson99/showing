import { describe, expect, it } from "vitest";
import { jsonLdImovel, serializarJsonLd } from "./seo";

const base = {
  slug: "apartamento-2-quartos-garcia-blumenau",
  titulo: "Apartamento de 2 quartos",
  descricao: "Sala  integrada\n e sacada.",
  bairro: "Garcia",
  cidade: "Blumenau",
  endereco: "Rua Exemplo, 123",
  mostrarEndereco: false,
  latitude: -26.9194,
  longitude: -49.0661,
  preco: 350000,
  status: "publicado" as const,
  fotos: [{ src: "/mock-uploads/a.png" }, { src: "https://images.unsplash.com/photo-1?w=800" }],
};

describe("jsonLdImovel (RF-26)", () => {
  it("monta RealEstateListing com Offer e Place, fotos absolutas e descrição limpa", () => {
    const j = jsonLdImovel(base);
    expect(j["@type"]).toBe("RealEstateListing");
    expect(j.offers).toMatchObject({ "@type": "Offer", price: 350000, priceCurrency: "BRL", availability: "https://schema.org/InStock" });
    expect(j.contentLocation["@type"]).toBe("Place");
    expect(j.image[0]).toMatch(/^https?:\/\/.+\/mock-uploads\/a\.png$/);
    expect(j.image[1]).toBe("https://images.unsplash.com/photo-1?w=800");
    expect(j.description).toBe("Sala integrada e sacada.");
  });

  it("não expõe endereço nem coordenadas sem a opção do corretor (RN-05)", () => {
    const texto = JSON.stringify(jsonLdImovel(base));
    expect(texto).not.toContain("Rua Exemplo");
    expect(texto).not.toContain("-26.9194");
    expect(texto).toContain("Garcia, Blumenau");
  });

  it("expõe endereço e coordenadas quando o corretor marcou", () => {
    const j = jsonLdImovel({ ...base, mostrarEndereco: true });
    expect(j.contentLocation.address).toMatchObject({ streetAddress: "Rua Exemplo, 123" });
    expect(j.contentLocation).toMatchObject({ geo: { latitude: -26.9194, longitude: -49.0661 } });
  });

  it("marca imóvel vendido como esgotado", () => {
    expect(jsonLdImovel({ ...base, status: "vendido" }).offers.availability).toBe("https://schema.org/SoldOut");
  });
});

describe("serializarJsonLd", () => {
  it("escapa `<` para o título não fechar a tag <script>", () => {
    const saida = serializarJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(saida).not.toContain("</script>");
    expect(JSON.parse(saida).name).toBe("</script><script>alert(1)</script>");
  });
});
