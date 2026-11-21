import { ChatBubbleLazy } from "@/components/chat-bubble/ChatBubbleLazy";
import { fonteDisplay, fonteTexto } from "@/components/landing/fontes";
import { GaleriaGrade } from "@/components/imovel/GaleriaGrade";
import { MapaRegiao } from "@/components/imovel/MapaRegiao";
import { RegistrarVisualizacao } from "@/components/imovel/RegistrarVisualizacao";
import { formatarPreco } from "@/lib/format";
import type { FotoPublica, ImovelPublico } from "@/lib/imoveis";
import { numeroDoCampo, type EntradaRoteiro } from "@/lib/pagina/entrada";
import type { Roteiro } from "@/lib/pagina/roteiro";
import { TIPOS } from "@/lib/painel/schema";
import { Ambientes } from "./Ambientes";
import { Bairro } from "./Bairro";
import { Cabecalho } from "./Cabecalho";
import { Duvidas } from "./Duvidas";
import { GaleriaHorizontal } from "./GaleriaHorizontal";
import { Hero } from "./Hero";
import { Numeros } from "./Numeros";
import { Visita } from "./Visita";

type Props = {
  imovel: ImovelPublico;
  roteiro: Roteiro;
  /** Faixa da pré-visualização do corretor. Com ela, a página não conta métricas. */
  faixa?: React.ReactNode;
};

const ROTULO_NUMERO: Record<string, string> = { "imovel.quartos": "quartos", "imovel.areaM2": "m²", "imovel.area": "m²", "imovel.vagas": "vagas", "imovel.banheiros": "banheiros", "imovel.suites": "suítes" };

// A página do imóvel contada em capítulos (docs/agent-diretor-pagina.md). O agente escolheu a ordem e escreveu os
// textos; aqui só se desenha. Nada do roteiro vira HTML ou estilo: são textos e ids de foto.
export function PaginaRoteiro({ imovel, roteiro, faixa }: Props) {
  const vendido = imovel.status === "vendido";
  const fotos = new Map<string, FotoPublica>(imovel.fotos.map((f) => [f.id, f]));
  const foto = (id: string) => fotos.get(id);
  const entrada = { imovel, fotos: imovel.fotos } as unknown as EntradaRoteiro;
  const fotoDoCorretor = imovel.corretor.fotoSrc;
  const creci = imovel.corretor.creci ? `CRECI ${imovel.corretor.creci.replace(/^CRECI[-\s]*/i, "")}` : "";
  const local = `${imovel.bairro}, ${imovel.cidade}`;

  const capitulos = roteiro.capitulos.map((c, n) => {
    const id = `cap-${c.tipo}`;
    const indice = n; // o hero não tem número; os demais contam de 1
    switch (c.tipo) {
      case "hero_imagem": {
        const f = foto(c.foto) ?? imovel.fotos[0];
        const custos = [imovel.condominio !== null && `Condomínio ${formatarPreco(imovel.condominio)}`, imovel.iptu !== null && `IPTU ${formatarPreco(imovel.iptu)}/ano`].filter(Boolean).join(" · ");
        return (
          <Hero
            key={id}
            id={id}
            titulo={c.titulo.texto}
            foto={{ src: f.src, alt: f.alt }}
            etiqueta={`${imovel.finalidade === "venda" ? "Venda" : "Aluguel"} · ${local}`}
            preco={formatarPreco(imovel.preco)}
            custos={custos || null}
            movimento={c.movimento}
            vendido={vendido}
          />
        );
      }
      case "numeros":
        return (
          <Numeros
            key={id}
            id={id}
            indice={indice}
            titulo={c.titulo.texto}
            itens={c.itens.flatMap((i) => {
              const valor = numeroDoCampo(entrada, i.campo);
              return valor === null ? [] : [{ valor, rotulo: i.rotulo || ROTULO_NUMERO[i.campo] || "" }];
            })}
            movimento={c.movimento}
          />
        );
      case "ambientes_fixo":
        return (
          <Ambientes
            key={id}
            id={id}
            indice={indice}
            quadros={c.quadros.flatMap((q) => {
              const f = foto(q.foto);
              return f ? [{ src: f.src, alt: f.alt, rotulo: q.rotulo, frase: q.frase.texto }] : [];
            })}
            movimento={c.movimento}
          />
        );
      case "galeria_horizontal":
        return <GaleriaHorizontal key={id} id={id} indice={indice} titulo={c.titulo.texto} fotos={c.fotos.flatMap((i) => foto(i) ?? [])} movimento={c.movimento} />;
      case "galeria_grade":
        return (
          <section key={id} id={id} data-tom="claro" data-capitulo="Fotos" className="bg-(--auth-claro) py-20">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
              <div>
                <span className="text-[13px] font-medium tracking-[0.08em] text-(--auth-ink-muted) uppercase">Capítulo {indice} · Fotos</span>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-[36px] leading-[1.04] font-bold tracking-[-0.025em] text-balance lg:text-[52px]">{c.titulo.texto}</h2>
              </div>
              <GaleriaGrade fotos={c.fotos.flatMap((i) => foto(i) ?? [])} />
            </div>
          </section>
        );
      case "bairro": {
        const b = imovel.infoBairro;
        const itens = b
          ? [
              b.escolas.length > 0 && { item: "Escolas", valor: b.escolas.join(", ") },
              b.mercados.length > 0 && { item: "Mercados", valor: b.mercados.join(", ") },
              b.saude.length > 0 && { item: "Saúde", valor: b.saude.join(", ") },
              b.distanciaCentro && { item: "Centro", valor: b.distanciaCentro },
            ].filter((x): x is { item: string; valor: string } => Boolean(x))
          : [];
        const temMapa = imovel.latitude !== null && imovel.longitude !== null;
        return (
          <Bairro
            key={id}
            id={id}
            indice={indice}
            titulo={c.titulo.texto}
            local={local}
            endereco={imovel.mostrarEndereco && imovel.endereco ? `Endereço: ${imovel.endereco}.` : "O endereço completo é combinado com o corretor."}
            itens={itens}
            mapa={temMapa ? <MapaRegiao imovel={imovel} cheio /> : null}
            movimento={c.movimento}
          />
        );
      }
      case "duvidas":
        return <Duvidas key={id} id={id} indice={indice} titulo={c.titulo.texto} perguntas={c.perguntas} corretor={imovel.corretor.nome} fotoCorretor={fotoDoCorretor} movimento={c.movimento} vendido={vendido} />;
      case "cta_visita":
        return <Visita key={id} id={id} indice={indice} titulo={c.titulo.texto} corretor={imovel.corretor.nome} creci={creci} fotoCorretor={fotoDoCorretor} movimento={c.movimento} vendido={vendido} />;
    }
  });

  return (
    <div className={`${fonteDisplay.variable} ${fonteTexto.variable} tema-marca bg-white font-[family-name:var(--font-inter)] text-(--auth-ink)`}>
      {faixa}
      <Cabecalho corretor={imovel.corretor.nome} creci={creci} vendido={vendido} />
      <main>{capitulos}</main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-6 py-6 text-[13px] text-(--auth-ink-muted)">
        <span>
          {imovel.corretor.nome} · {creci}
        </span>
        <span>
          {TIPOS[imovel.tipo]} · página criada com Showing
        </span>
      </footer>
      {!vendido && (
        <ChatBubbleLazy
          imovelId={imovel.id}
          tituloImovel={imovel.titulo}
          corretor={imovel.corretor.nome}
          imovel={{ preco: imovel.preco, condominio: imovel.condominio, iptu: imovel.iptu, aceitaFinanciamento: imovel.aceitaFinanciamento, aceitaFgts: imovel.aceitaFgts, quartos: imovel.quartos, areaM2: imovel.areaM2, bairro: imovel.bairro }}
          whatsapp={imovel.corretor.whatsapp}
          fotoSrc={fotoDoCorretor}
          semMetricas={Boolean(faixa)}
        />
      )}
      {!faixa && <RegistrarVisualizacao imovelId={imovel.id} />}
    </div>
  );
}
