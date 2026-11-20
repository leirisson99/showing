import type { ImovelPublico } from "@/lib/imoveis";
import { UNSPLASH, urlUnsplash, type FotoUnsplash } from "./unsplash";

// Dados de exemplo para desenvolver a interface antes de ligar o banco.
// Nada aqui é de um imóvel ou corretor real.

const foto = (f: FotoUnsplash, prefixo: string, id: string) => ({ id, src: urlUnsplash(f.id), alt: `${f.alt} (${prefixo} de exemplo)`, legenda: f.legenda });

// O id é o mesmo que src/mocks/painel.ts dá à foto no store: `${imovel}-foto-${posição}`.
const fotos = (prefixo: string, comFachada: boolean, imovelId: string) =>
  [comFachada && UNSPLASH.fachada, UNSPLASH.sala, UNSPLASH.cozinha, UNSPLASH.quarto, UNSPLASH.varanda, UNSPLASH.banheiro]
    .filter((f): f is FotoUnsplash => f !== false)
    .map((f, i) => foto(f, prefixo, `${imovelId}-foto-${i}`));

const corretor = {
  nome: "Corretor de Exemplo",
  creci: "CRECI-SC 00000",
  whatsapp: "5547999990000",
  fotoSrc: null,
};

export const imoveisMock: ImovelPublico[] = [
  {
    id: "mock-1",
    slug: "apartamento-2-quartos-victor-konder-blumenau",
    status: "publicado",
    tipo: "apartamento",
    finalidade: "venda",
    titulo: "Apartamento de 2 quartos no Victor Konder",
    descricao:
      "Apartamento de 2 quartos em prédio com elevador, a poucos minutos do centro de Blumenau. A sala é integrada à cozinha e abre para uma sacada com churrasqueira.\n\nOs dois quartos têm armários embutidos, e o banheiro foi reformado recentemente. O condomínio tem portaria e salão de festas. Este texto é um exemplo para desenvolvimento.",
    bairro: "Victor Konder",
    cidade: "Blumenau",
    endereco: "Rua Exemplo, 123",
    mostrarEndereco: false,
    latitude: -26.9194,
    longitude: -49.0661,
    preco: 480000,
    condominio: 520,
    iptu: 90,
    quartos: 2,
    suites: 1,
    banheiros: 1,
    vagas: 1,
    areaM2: 68,
    aceitaFinanciamento: true,
    aceitaFgts: true,
    caracteristicas: ["Sacada com churrasqueira", "Armários embutidos", "Elevador", "Portaria", "Salão de festas"],
    infoAdicional: "Aceita pets de pequeno porte. Chaves disponíveis para visita aos sábados.",
    fotos: fotos("apartamento", true, "mock-1"),
    infoBairro: {
      escolas: ["Escola de exemplo A", "Colégio de exemplo B"],
      mercados: ["Mercado de exemplo", "Padaria de exemplo"],
      saude: ["Posto de saúde de exemplo"],
      distanciaCentro: "10 minutos de carro",
    },
    corretor,
  },
  {
    id: "mock-2",
    slug: "casa-3-quartos-itoupava-norte-blumenau",
    status: "vendido",
    tipo: "casa",
    finalidade: "venda",
    titulo: "Casa de 3 quartos na Itoupava Norte",
    descricao: "Casa de exemplo já vendida, usada para testar o estado de imóvel vendido.",
    bairro: "Itoupava Norte",
    cidade: "Blumenau",
    endereco: null,
    mostrarEndereco: false,
    latitude: -26.8806,
    longitude: -49.0813,
    preco: 720000,
    condominio: null,
    iptu: 150,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    areaM2: 140,
    aceitaFinanciamento: true,
    aceitaFgts: null,
    caracteristicas: ["Quintal", "Churrasqueira"],
    infoAdicional: null,
    fotos: fotos("casa", false, "mock-2"),
    infoBairro: null,
    corretor,
  },
];
