import { Linha, Moldura } from "./Moldura";

type Props = { imovel: string; dataHora: string; comprador: string; contato: string; link: string };

// Aviso ao corretor de um novo pedido de visita (RN-21).
export function VisitaPedida({ imovel, dataHora, comprador, contato, link }: Props) {
  return (
    <Moldura titulo="Novo pedido de visita" intro="O atendente registrou um pedido. Confirme ou cancele pelo painel." botao={{ texto: "Ver no painel", href: link }}>
      <Linha rotulo="Imóvel" valor={imovel} />
      <Linha rotulo="Quando" valor={dataHora} />
      <Linha rotulo="Comprador" valor={comprador} />
      <Linha rotulo="Contato" valor={contato} />
      <p style={{ margin: "0 0 12px" }} />
    </Moldura>
  );
}
